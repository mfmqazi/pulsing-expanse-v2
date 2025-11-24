import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Check, Mic, SkipForward, Type, Languages, AlertCircle, BookOpen, EyeOff } from 'lucide-react';
import { getCurrentPlan, SURAH_VERSE_COUNTS, SURAH_NAMES } from '../data/memorizationPlan';
import HadithFooter from './HadithFooter';

const Memorize = ({ setView, user, updateUserProgress }) => {
    const [verses, setVerses] = useState([]);
    const [currentVerseIndex, setCurrentVerseIndex] = useState(user?.progress?.verseIndex || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTranslation, setShowTranslation] = useState(() => JSON.parse(localStorage.getItem('showTranslation')) ?? true);
    const [showTransliteration, setShowTransliteration] = useState(() => JSON.parse(localStorage.getItem('showTransliteration')) ?? true);
    const [reciterName, setReciterName] = useState('');
    const [translationName, setTranslationName] = useState('');

    // 6446 Method State
    const is6446Mode = user?.settings?.memorizationMethod === '6446';
    const [methodState, setMethodState] = useState({
        step: 1, // 1: Read 6x, 2: Recite 4x, 3: Read 4x, 4: Recite 6x
        count: 0
    });

    const audioRef = useRef(null);
    const recognitionRef = useRef(null);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('showTranslation', JSON.stringify(showTranslation));
        localStorage.setItem('showTransliteration', JSON.stringify(showTransliteration));
    }, [showTranslation, showTransliteration]);

    useEffect(() => {
        fetchVerses();
        setupSpeechRecognition();
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [user?.progress?.surah, user?.settings?.reciterId, user?.settings?.translationId]);

    // Sync local state with user progress when it changes
    useEffect(() => {
        if (verses.length > 0) {
            if (user?.progress?.verseIndex < verses.length) {
                setCurrentVerseIndex(user.progress.verseIndex);
            } else if (user?.progress?.verseIndex >= verses.length && verses.length > 0) {
                setCurrentVerseIndex(0);
            }
        }
    }, [verses, user?.progress?.verseIndex]);

    // Reset 6446 state when verse changes
    useEffect(() => {
        setMethodState({ step: 1, count: 0 });
        // Reset visibility based on mode
        if (is6446Mode) {
            setIsHidden(false); // Step 1 is always looking
        } else {
            setIsHidden(false);
        }
    }, [currentVerseIndex, is6446Mode]);

    // Handle 6446 Visibility Logic
    useEffect(() => {
        if (is6446Mode) {
            if (methodState.step === 2 || methodState.step === 4) {
                setIsHidden(true);
            } else {
                setIsHidden(false);
            }
        }
    }, [methodState.step, is6446Mode]);

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

            const response = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surah}?language=en&translations=${translationId},57&audio=${reciterId}&per_page=300&fields=text_uthmani,text_imlaei_simple`);

            if (!response.ok) throw new Error('Failed to fetch verses');

            const data = await response.json();

            const processedVerses = data.verses.map(verse => {
                const translationObj = verse.translations?.find(t => t.resource_id === translationId);
                const rawTranslation = translationObj?.text || "Translation not available";
                const translation = rawTranslation.replace(/<[^>]*>/g, '');

                const transliterationObj = verse.translations?.find(t => t.resource_id === 57);
                const rawTransliteration = transliterationObj?.text || "";
                const transliteration = rawTransliteration.replace(/<[^>]*>/g, '');

                let audioUrl = verse.audio?.url;
                let isFullUrl = false;

                if (isCustomReciter) {
                    const surahPad = String(surah).padStart(3, '0');
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

            setVerses(processedVerses);
            setReciterName(user?.settings?.reciterName || 'Mishary Rashid Alafasy');
            setTranslationName(user?.settings?.translationName || 'Sahih International');

        } catch (err) {
            console.error("Error fetching verses:", err);
            setError('Failed to load verses. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };


    const setupSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'ar-SA';
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                checkRecitation(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                setFeedback('Error listening. Please try again.');
            };

            recognitionRef.current = recognition;
        }
    };

    const checkRecitation = (transcript) => {
        if (transcript.length > 5) {
            setFeedback('Masha\'Allah! Good recitation.');
            // For 6446, we could auto-advance count here, but let's keep it manual for control
        } else {
            setFeedback('Try again. Make sure to recite clearly.');
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleListen = () => {
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setFeedback('Listening...');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const saveProgress = (newIndex, extraUpdates = {}, shouldUpdateProgress = false) => {
        const currentSurah = user?.progress?.surah || 1;

        let updates = {
            verseIndex: newIndex,
            ...extraUpdates
        };

        if (shouldUpdateProgress) {
            const plan = getCurrentPlan(currentSurah, newIndex, user?.settings);
            const allMemorized = extraUpdates.memorized || user?.progress?.memorized || {};
            const surahMemorized = allMemorized[currentSurah] || [];
            const today = new Date().toDateString();
            const lastActivityDate = user?.lastActivityDate;
            let dailyMemorized = user?.progress?.dailyMemorized || [];

            if (lastActivityDate !== today) {
                dailyMemorized = [];
            }

            if (extraUpdates.memorized) {
                const verseKey = `${currentSurah}-${newIndex}`;
                if (!dailyMemorized.includes(verseKey)) {
                    dailyMemorized = [...dailyMemorized, verseKey];
                }
            }

            const versesPerDay = user?.settings?.planType === 'custom'
                ? (parseInt(user?.settings?.versesPerDay) || 5)
                : Math.max(1, Math.ceil(6236 / ((parseFloat(user?.settings?.targetDuration) || 2) * 365)));

            const dailyGoalPercent = Math.min(100, Math.round((dailyMemorized.length / versesPerDay) * 100));

            let planProgressPercent = 0;
            if (plan) {
                const totalVersesInPlan = plan.endVerse - plan.startVerse + 1;
                let memorizedInPlan = 0;
                for (let i = plan.startVerse - 1; i < plan.endVerse; i++) {
                    if (surahMemorized.includes(i)) {
                        memorizedInPlan++;
                    }
                }
                planProgressPercent = Math.round((memorizedInPlan / totalVersesInPlan) * 100);
            } else {
                planProgressPercent = Math.round((surahMemorized.length / verses.length) * 100);
            }

            updates.percent = dailyGoalPercent;
            updates.planProgress = planProgressPercent;
            updates.dailyMemorized = dailyMemorized;
        }

        updateUserProgress(updates);
    };

    const handleNext = async (extraUpdates = {}) => {
        if (currentVerseIndex < verses.length - 1) {
            const newIndex = currentVerseIndex + 1;
            setCurrentVerseIndex(newIndex);
            setIsPlaying(false);
            setFeedback('');
            saveProgress(newIndex, extraUpdates, Object.keys(extraUpdates).length > 0);
        } else {
            const currentSurah = user?.progress?.surah || 1;
            const memorizedInSurah = user?.progress?.memorized?.[currentSurah] || [];
            const totalVersesInCurrentSurah = SURAH_VERSE_COUNTS[currentSurah] || verses.length;
            const currentMemorizedList = extraUpdates.memorized?.[currentSurah] || memorizedInSurah;
            const memorizedCount = currentMemorizedList.length;

            if (memorizedCount >= totalVersesInCurrentSurah && currentSurah < 114) {
                setFeedback('Surah Completed! Masha\'Allah! Moving to next Surah...');
                saveProgress(currentVerseIndex, extraUpdates);

                setTimeout(() => {
                    updateUserProgress({
                        surah: currentSurah + 1,
                        verseIndex: 0,
                        surahName: `Surah ${currentSurah + 1}`
                    });
                    setCurrentVerseIndex(0);
                    setFeedback('');
                }, 2000);
            } else {
                setFeedback('Great work! Continue memorizing the rest of this Surah.');
                saveProgress(currentVerseIndex, extraUpdates, Object.keys(extraUpdates).length > 0);
            }
        }
    };

    const handlePrev = () => {
        if (currentVerseIndex > 0) {
            const newIndex = currentVerseIndex - 1;
            setCurrentVerseIndex(newIndex);
            setIsPlaying(false);
            setFeedback('');
            updateUserProgress({ verseIndex: newIndex });
        }
    };

    const markAsMemorized = () => {
        const surahNumber = user?.progress?.surah || 1;
        const currentMemorized = user?.progress?.memorized || {};
        const surahMemorized = currentMemorized[surahNumber] || [];

        if (!surahMemorized.includes(currentVerseIndex)) {
            const updatedSurahMemorized = [...surahMemorized, currentVerseIndex];
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

            setFeedback('Marked as memorized!');
            handleNext(updates);
        } else {
            handleNext();
        }
    };

    // 6446 Logic
    const getStepTarget = (step) => {
        switch (step) {
            case 1: return 6;
            case 2: return 4;
            case 3: return 4;
            case 4: return 6;
            default: return 6;
        }
    };

    const getStepDescription = (step) => {
        switch (step) {
            case 1: return "Read 6 times (Looking)";
            case 2: return "Recite 4 times (From Memory)";
            case 3: return "Read 4 times (Looking)";
            case 4: return "Recite 6 times (From Memory)";
            default: return "";
        }
    };

    const advance6446 = () => {
        const target = getStepTarget(methodState.step);
        const newCount = methodState.count + 1;

        if (newCount >= target) {
            // Step Complete
            if (methodState.step === 4) {
                // Full Cycle Complete
                setFeedback("6446 Cycle Complete! Masha'Allah.");
                setTimeout(() => {
                    markAsMemorized();
                }, 1000);
            } else {
                // Move to next step
                setMethodState({
                    step: methodState.step + 1,
                    count: 0
                });
                setFeedback(`Step ${methodState.step} Complete! Starting Step ${methodState.step + 1}...`);
                setTimeout(() => setFeedback(''), 2000);
            }
        } else {
            // Increment count
            setMethodState(prev => ({ ...prev, count: newCount }));
        }
    };


    if (isLoading) return <div className="flex-center" style={{ height: '100vh' }}>Loading verses...</div>;
    if (error) return <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}><p className="text-danger">{error}</p><button className="btn-primary" onClick={fetchVerses}>Retry</button></div>;

    const currentVerse = verses[currentVerseIndex];

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
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', padding: '20px', paddingBottom: '120px', textAlign: 'center', position: 'relative', overflowY: 'auto' }}>

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


                <div style={{ marginBottom: '30px', width: '100%' }}>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '10px' }}>
                        {SURAH_NAMES[user?.progress?.surah || 1] || `Surah ${user?.progress?.surah || 1}`} - Verse {currentVerseIndex + 1}
                    </h2>

                    {/* 6446 Method Indicator */}
                    {is6446Mode && (
                        <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                6-4-4-6 Method
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                {methodState.step % 2 !== 0 ? <BookOpen size={20} color="var(--primary)" /> : <EyeOff size={20} color="var(--accent)" />}
                                {getStepDescription(methodState.step)}
                            </div>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                {Array.from({ length: getStepTarget(methodState.step) }).map((_, idx) => (
                                    <div key={idx} style={{
                                        width: '30px',
                                        height: '8px',
                                        borderRadius: '4px',
                                        background: idx < methodState.count ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                                        transition: 'background 0.3s'
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Arabic Text */}
                    <p style={{
                        fontSize: '2.5rem',
                        lineHeight: '1.6',
                        marginBottom: '20px',
                        filter: isHidden ? 'blur(15px)' : 'none',
                        transition: 'filter 0.5s ease',
                        userSelect: isHidden ? 'none' : 'auto',
                        fontFamily: "'Amiri', serif"
                    }}>
                        {currentVerse?.text_uthmani}
                    </p>

                    {/* Transliteration */}
                    {showTransliteration && (
                        <p style={{
                            fontSize: '1.1rem',
                            color: 'var(--text-muted)',
                            marginBottom: '15px',
                            fontStyle: 'italic',
                            filter: isHidden ? 'blur(8px)' : 'none',
                            transition: 'filter 0.5s ease',
                            userSelect: isHidden ? 'none' : 'auto',
                        }}>
                            {currentVerse?.transliteration}
                        </p>
                    )}

                    {/* Translation */}
                    {showTranslation && (
                        <p style={{
                            fontSize: '1.2rem',
                            marginBottom: '20px',
                            filter: isHidden ? 'blur(8px)' : 'none',
                            transition: 'filter 0.5s ease',
                            userSelect: isHidden ? 'none' : 'auto',
                        }}>
                            {currentVerse?.translation}
                        </p>
                    )}
                </div>

                {feedback && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(16, 185, 129, 0.2)',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        zIndex: 10
                    }}>
                        {feedback.includes('Try again') ? <AlertCircle size={16} /> : <Check size={16} />}
                        {feedback}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                    <button className="btn-outline" onClick={togglePlay}>
                        {isPlaying ? <Pause /> : <Play />}
                    </button>
                    {!is6446Mode && (
                        <button className="btn-outline" onClick={() => setIsHidden(!isHidden)}>
                            {isHidden ? 'Show' : 'Hide'}
                        </button>
                    )}
                    <button className={`btn-outline ${isListening ? 'listening' : ''}`} onClick={toggleListen} style={{ borderColor: isListening ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}>
                        <Mic color={isListening ? 'var(--accent)' : 'white'} />
                    </button>
                </div>

                {is6446Mode ? (
                    // 6446 Controls
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button
                            className="btn-primary"
                            onClick={advance6446}
                            style={{ width: '100%', padding: '15px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                        >
                            <Check size={24} />
                            {methodState.count + 1 === getStepTarget(methodState.step)
                                ? (methodState.step === 4 ? "Finish Verse" : "Complete Step")
                                : `Complete Repetition ${methodState.count + 1}/${getStepTarget(methodState.step)}`
                            }
                        </button>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="btn-outline" onClick={handlePrev} disabled={currentVerseIndex === 0} style={{ flex: 1 }}>
                                <RotateCcw size={18} /> Prev
                            </button>
                            <button className="btn-outline" onClick={() => handleNext()} style={{ flex: 1 }}>
                                Skip <SkipForward size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Standard Controls
                    <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center' }}>
                        <button className="btn-outline" onClick={handlePrev} disabled={currentVerseIndex === 0}>
                            <RotateCcw size={20} /> Prev
                        </button>
                        <button className="btn-primary" onClick={markAsMemorized}>
                            Mark Memorized <Check size={20} style={{ marginLeft: '5px' }} />
                        </button>
                        <button className="btn-outline" onClick={() => handleNext()} disabled={currentVerseIndex === verses.length - 1}>
                            Skip <SkipForward size={20} style={{ marginLeft: '5px' }} />
                        </button>
                    </div>
                )}

                {/* Audio Element */}
                {currentVerse?.audio_url && (
                    <audio
                        ref={audioRef}
                        src={currentVerse.is_full_url ? currentVerse.audio_url : `https://verses.quran.com/${currentVerse.audio_url}`}
                        onEnded={() => setIsPlaying(false)}
                    />
                )}
            </div>

            <HadithFooter />
        </div>
    );
};

export default Memorize;
