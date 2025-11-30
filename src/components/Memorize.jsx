// Author: Musaddique Husain Qazi
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Check, Type, Languages, AlertCircle, BookOpen, EyeOff, CheckCircle, RotateCcw, SkipForward } from 'lucide-react';
import { getCurrentPlan, SURAH_VERSE_COUNTS, SURAH_NAMES } from '../data/memorizationPlan';
import HadithFooter from './HadithFooter';

const Memorize = ({ setView, user, updateUserProgress }) => {
    const [verses, setVerses] = useState([]);
    const [currentVerseIndex, setCurrentVerseIndex] = useState(user?.progress?.verseIndex || 0);
    const [playingVerseIndex, setPlayingVerseIndex] = useState(null);
    const [isHidden, setIsHidden] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTranslation, setShowTranslation] = useState(() => JSON.parse(localStorage.getItem('showTranslation')) ?? true);
    const [showTransliteration, setShowTransliteration] = useState(() => JSON.parse(localStorage.getItem('showTransliteration')) ?? true);
    const [reciterName, setReciterName] = useState('');
    const [translationName, setTranslationName] = useState('');

    const audioRefs = useRef([]);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('showTranslation', JSON.stringify(showTranslation));
        localStorage.setItem('showTransliteration', JSON.stringify(showTransliteration));
    }, [showTranslation, showTransliteration]);

    useEffect(() => {
        fetchVerses();
        return () => {
            // Cleanup all audio elements
            audioRefs.current.forEach(audio => {
                if (audio) audio.pause();
            });
        };
    }, [user?.progress?.surah, user?.progress?.verseIndex, user?.settings?.reciterId, user?.settings?.translationId, user?.settings?.versesDisplayMode, user?.settings?.versesToDisplay]);

    const fetchVerses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const surah = user?.progress?.surah || 1;
            let reciterId = user?.settings?.reciterId || 7;
            const translationId = user?.settings?.translationId || 85;

            const isCustomReciter = reciterId === 999;
            if (isCustomReciter) {
                reciterId = 7;
            }

            // Use getCurrentPlan to determine what to fetch
            // We use the current verse index to determine the dynamic plan
            const currentPlan = getCurrentPlan(surah, currentVerseIndex, user.settings);
            const segments = currentPlan.segments || [{ surah, startVerse: 1, endVerse: 7 }];

            let allVerses = [];

            for (const segment of segments) {
                // Fetch verses for this segment
                // We fetch a large chunk (up to 300) to ensure we get the verses we need
                const perPage = 300;

                const response = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${segment.surah}?language=en&translations=${translationId},57&audio=${reciterId}&page=1&per_page=${perPage}&fields=text_uthmani,text_imlaei_simple`);

                if (!response.ok) throw new Error(`Failed to fetch verses for Surah ${segment.surah}`);

                const data = await response.json();

                // Filter verses for this segment
                const segmentVerses = data.verses.filter(v => {
                    const vNum = parseInt(v.verse_key.split(':')[1]);
                    return vNum >= segment.startVerse && vNum <= segment.endVerse;
                }).map(verse => {
                    const translationObj = verse.translations?.find(t => t.resource_id === translationId);
                    const rawTranslation = translationObj?.text || "Translation not available";
                    const translation = rawTranslation.replace(/<[^>]*>/g, '');

                    const transliterationObj = verse.translations?.find(t => t.resource_id === 57);
                    const rawTransliteration = transliterationObj?.text || "";
                    const transliteration = rawTransliteration.replace(/<[^>]*>/g, '');

                    let audioUrl = verse.audio?.url;
                    let isFullUrl = false;

                    if (isCustomReciter) {
                        const surahPad = String(segment.surah).padStart(3, '0');
                        const versePad = String(verse.verse_key.split(':')[1]).padStart(3, '0');
                        audioUrl = `https://everyayah.com/data/Ghamadi_40kbps/${surahPad}${versePad}.mp3`;
                        isFullUrl = true;
                    }

                    return {
                        ...verse,
                        audio_url: audioUrl,
                        is_full_url: isFullUrl,
                        translation,
                        transliteration
                    };
                });

                allVerses = [...allVerses, ...segmentVerses];
            }

            setVerses(allVerses);
            setReciterName(user?.settings?.reciterName || 'Mishary Rashid Alafasy');
            setTranslationName(user?.settings?.translationName || 'Sahih International');

        } catch (err) {
            console.error("Error fetching verses:", err);
            setError('Failed to load verses. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlayVerse = (index) => {
        const audio = audioRefs.current[index];
        if (!audio) return;

        // Pause all other audios
        audioRefs.current.forEach((a, i) => {
            if (a && i !== index) {
                a.pause();
                a.currentTime = 0;
            }
        });

        if (playingVerseIndex === index) {
            audio.pause();
            setPlayingVerseIndex(null);
        } else {
            audio.play();
            setPlayingVerseIndex(index);
        }
    };

    const toggleVerseMemorized = (verseIndex) => {
        const surahNumber = user?.progress?.surah || 1;
        const currentMemorized = user?.progress?.memorized || {};
        const surahMemorized = currentMemorized[surahNumber] || [];

        let updatedSurahMemorized;
        if (surahMemorized.includes(verseIndex)) {
            // Unmark
            updatedSurahMemorized = surahMemorized.filter(v => v !== verseIndex);
        } else {
            // Mark as memorized
            updatedSurahMemorized = [...surahMemorized, verseIndex];
        }

        const updatedMemorized = {
            ...currentMemorized,
            [surahNumber]: updatedSurahMemorized
        };

        const today = new Date().toDateString();
        const lastActivity = user?.lastActivityDate;
        const shouldIncrementStreak = lastActivity !== today;

        const updates = {
            memorized: updatedMemorized,
            streak: shouldIncrementStreak ? (user.streak || 0) + 1 : user.streak,
            lastActivityDate: today
        };

        updateUserProgress(updates);
        setFeedback(surahMemorized.includes(verseIndex) ? 'Unmarked!' : 'Marked as memorized!');
        setTimeout(() => setFeedback(''), 2000);
    };

    const handlePrev = () => {
        const versesDisplayMode = user?.settings?.versesDisplayMode || 'specific';
        const currentSurah = user?.progress?.surah || 1;

        if (versesDisplayMode === 'entireSurah') {
            // Navigate to previous surah
            if (currentSurah > 1) {
                updateUserProgress({
                    surah: currentSurah - 1,
                    verseIndex: 0
                });
            }
        } else {
            // Navigate to previous set of N verses
            const versesToDisplay = parseInt(user?.settings?.versesToDisplay) || 5;

            let prevSurah = currentSurah;
            let prevVerseIndex = currentVerseIndex - versesToDisplay;

            while (prevVerseIndex < 0) {
                if (prevSurah > 1) {
                    prevSurah--;
                    const totalVersesPrev = SURAH_VERSE_COUNTS[prevSurah] || 300;
                    prevVerseIndex += totalVersesPrev;
                } else {
                    // Start of Quran
                    prevVerseIndex = 0;
                    break;
                }
            }

            setCurrentVerseIndex(prevVerseIndex);
            updateUserProgress({ surah: prevSurah, verseIndex: prevVerseIndex });
        }
    };

    const handleNext = () => {
        const versesDisplayMode = user?.settings?.versesDisplayMode || 'specific';
        const currentSurah = user?.progress?.surah || 1;

        if (versesDisplayMode === 'entireSurah') {
            // Navigate to next surah
            if (currentSurah < 114) {
                updateUserProgress({
                    surah: currentSurah + 1,
                    verseIndex: 0
                });
            }
        } else {
            // Navigate to next set of N verses
            const versesToDisplay = parseInt(user?.settings?.versesToDisplay) || 5;

            let nextSurah = currentSurah;
            let nextVerseIndex = currentVerseIndex + versesToDisplay;

            // Check if we overflow current Surah
            while (true) {
                const totalVerses = SURAH_VERSE_COUNTS[nextSurah] || 300;
                if (nextVerseIndex < totalVerses) {
                    break; // Fits in current Surah
                } else {
                    // Overflow
                    nextVerseIndex -= totalVerses;
                    if (nextSurah < 114) {
                        nextSurah++;
                    } else {
                        // End of Quran
                        nextVerseIndex = totalVerses - 1;
                        break;
                    }
                }
            }

            setCurrentVerseIndex(nextVerseIndex);
            updateUserProgress({ surah: nextSurah, verseIndex: nextVerseIndex });
        }
    };

    const markAllDisplayedAsMemorized = () => {
        const surahNumber = user?.progress?.surah || 1;
        const currentMemorized = user?.progress?.memorized || {};
        const surahMemorized = currentMemorized[surahNumber] || [];

        // Mark all currently displayed verses as memorized
        const newMemorizedVerses = [];
        verses.forEach(verse => {
            const verseNumber = parseInt(verse.verse_key.split(':')[1]) - 1;
            if (!surahMemorized.includes(verseNumber)) {
                newMemorizedVerses.push(verseNumber);
            }
        });

        if (newMemorizedVerses.length > 0) {
            const updatedSurahMemorized = [...surahMemorized, ...newMemorizedVerses];
            const updatedMemorized = {
                ...currentMemorized,
                [surahNumber]: updatedSurahMemorized
            };

            const today = new Date().toDateString();
            const lastActivity = user?.lastActivityDate;
            const shouldIncrementStreak = lastActivity !== today;

            const updates = {
                memorized: updatedMemorized,
                streak: shouldIncrementStreak ? (user.streak || 0) + 1 : user.streak,
                lastActivityDate: today
            };

            updateUserProgress(updates);

            // Move forward after marking
            setTimeout(() => {
                handleNext();
            }, 500);
        } else {
            // Still move forward
            setTimeout(() => {
                handleNext();
            }, 500);
        }
    };

    if (isLoading) return <div className="flex-center" style={{ height: '100vh' }}>Loading verses...</div>;
    if (error) return <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}><p className="text-danger">{error}</p><button className="btn-primary" onClick={fetchVerses}>Retry</button></div>;

    const surahNumber = user?.progress?.surah || 1;
    const memorizedVerses = user?.progress?.memorized?.[surahNumber] || [];

    return (
        <div className="container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowTranslation(!showTranslation)}
                        style={{ background: 'none', border: 'none', color: showTranslation ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}
                        title="Toggle Translation"
                    >
                        <Languages size={24} />
                    </button>
                    <button
                        onClick={() => setShowTransliteration(!showTransliteration)}
                        style={{ background: 'none', border: 'none', color: showTransliteration ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}
                        title="Toggle Transliteration"
                    >
                        <Type size={24} />
                    </button>
                    <button
                        onClick={() => setIsHidden(!isHidden)}
                        style={{ background: 'none', border: 'none', color: isHidden ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}
                        title="Toggle Hide/Show"
                    >
                        {isHidden ? <EyeOff size={24} /> : <BookOpen size={24} />}
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: '80px', overflowY: 'auto' }}>

                {/* Reciter and Translation Info */}
                {(reciterName || translationName) && (
                    <div style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(212, 175, 55, 0.08)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        gap: '15px',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        fontSize: '0.85rem',
                        color: 'white',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {reciterName && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>Reciter:</span>
                                <span style={{ color: 'var(--primary)' }}>{reciterName}</span>
                            </div>
                        )}
                        {translationName && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>Translation:</span>
                                <span style={{ color: 'var(--accent)' }}>{translationName}</span>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '10px' }}>
                        {SURAH_NAMES[surahNumber] || `Surah ${surahNumber}`}
                    </h2>
                    {user?.settings?.versesDisplayMode !== 'entireSurah' && verses.length > 0 && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Displaying {verses.length} verse{verses.length !== 1 ? 's' : ''}
                            {verses[0] && ` (${verses[0].verse_key.split(':')[1]}-${verses[verses.length - 1].verse_key.split(':')[1]} of ${SURAH_VERSE_COUNTS[surahNumber]})`}
                        </p>
                    )}
                    {user?.settings?.versesDisplayMode === 'entireSurah' && verses.length > 0 && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Entire Surah ({verses.length} verses)
                        </p>
                    )}
                </div>

                {feedback && (
                    <div style={{
                        position: 'fixed',
                        top: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(16, 185, 129, 0.2)',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        zIndex: 1000
                    }}>
                        {feedback.includes('Unmarked') ? <AlertCircle size={16} /> : <Check size={16} />}
                        {feedback}
                    </div>
                )}

                {/* All Verses Displayed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {verses.map((verse, index) => {
                        const verseNumber = parseInt(verse.verse_key.split(':')[1]) - 1;
                        const isMemorized = memorizedVerses.includes(verseNumber);
                        const isPlaying = playingVerseIndex === index;

                        return (
                            <div
                                key={verse.id}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    position: 'relative'
                                }}
                            >
                                {/* Verse Number and Controls */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                                        Verse {verse.verse_key.split(':')[1]}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => togglePlayVerse(index)}
                                            style={{
                                                background: 'none',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '50%',
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: isPlaying ? 'var(--primary)' : 'white'
                                            }}
                                        >
                                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <button
                                            onClick={() => toggleVerseMemorized(verseNumber)}
                                            style={{
                                                background: 'none',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '50%',
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: isMemorized ? 'var(--accent)' : 'rgba(255, 255, 255, 0.5)'
                                            }}
                                        >
                                            {isMemorized ? <CheckCircle size={18} /> : <Check size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Arabic Text */}
                                <p style={{
                                    fontSize: verses.length > 10 ? '1.8rem' : '2.2rem',
                                    lineHeight: '1.8',
                                    marginBottom: '15px',
                                    filter: isHidden ? 'blur(12px)' : 'none',
                                    transition: 'filter 0.5s ease',
                                    userSelect: isHidden ? 'none' : 'auto',
                                    fontFamily: "'Amiri', serif",
                                    textAlign: 'right',
                                    direction: 'rtl'
                                }}>
                                    {verse.text_uthmani}
                                </p>

                                {/* Transliteration */}
                                {showTransliteration && (
                                    <p style={{
                                        fontSize: verses.length > 10 ? '0.9rem' : '1rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '12px',
                                        fontStyle: 'italic',
                                        filter: isHidden ? 'blur(8px)' : 'none',
                                        transition: 'filter 0.5s ease',
                                        userSelect: isHidden ? 'none' : 'auto',
                                    }}>
                                        {verse.transliteration}
                                    </p>
                                )}

                                {/* Translation */}
                                {showTranslation && (
                                    <p style={{
                                        fontSize: verses.length > 10 ? '0.95rem' : '1.1rem',
                                        marginBottom: '0',
                                        filter: isHidden ? 'blur(8px)' : 'none',
                                        transition: 'filter 0.5s ease',
                                        userSelect: isHidden ? 'none' : 'auto',
                                        lineHeight: '1.6'
                                    }}>
                                        {verse.translation}
                                    </p>
                                )}

                                {/* Audio Element */}
                                {verse.audio_url && (
                                    <audio
                                        ref={el => audioRefs.current[index] = el}
                                        src={verse.is_full_url ? verse.audio_url : `https://verses.quran.com/${verse.audio_url}`}
                                        onEnded={() => setPlayingVerseIndex(null)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Controls */}
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '30px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <button
                        className="btn-outline"
                        onClick={handlePrev}
                        disabled={
                            user?.settings?.versesDisplayMode === 'entireSurah'
                                ? (user?.progress?.surah || 1) <= 1
                                : currentVerseIndex === 0
                        }
                        style={{
                            opacity: (user?.settings?.versesDisplayMode === 'entireSurah'
                                ? (user?.progress?.surah || 1) <= 1
                                : currentVerseIndex === 0) ? 0.5 : 1
                        }}
                    >
                        <RotateCcw size={20} /> Prev
                    </button>
                    <button className="btn-primary" onClick={markAllDisplayedAsMemorized}>
                        Mark Memorized <Check size={20} style={{ marginLeft: '5px' }} />
                    </button>
                    <button
                        className="btn-outline"
                        onClick={handleNext}
                        disabled={
                            user?.settings?.versesDisplayMode === 'entireSurah'
                                ? (user?.progress?.surah || 1) >= 114
                                : currentVerseIndex >= (SURAH_VERSE_COUNTS[user?.progress?.surah || 1] - 1)
                        }
                        style={{
                            opacity: (user?.settings?.versesDisplayMode === 'entireSurah'
                                ? (user?.progress?.surah || 1) >= 114
                                : currentVerseIndex >= (SURAH_VERSE_COUNTS[user?.progress?.surah || 1] - 1)) ? 0.5 : 1
                        }}
                    >
                        Skip <SkipForward size={20} style={{ marginLeft: '5px' }} />
                    </button>
                </div>
            </div>

            <HadithFooter />
        </div>
    );
};

export default Memorize;
