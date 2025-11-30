// Author: Musaddique Husain Qazi
import React from 'react';
import { ArrowLeft, BookOpen, Settings, Activity, Layers, Mic, Globe } from 'lucide-react';
import HadithFooter from './HadithFooter';

const Tutorial = ({ setView }) => {
    return (
        <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button
                    onClick={() => setView('home')}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '15px' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={24} /> App Tutorial & Guide
                </h2>
            </div>

            <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: 'var(--primary)' }}>Purpose of Al-Hafiz</h3>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Al-Hafiz is your dedicated companion for Quran memorization. Whether you are starting your journey or revising,
                    this application is designed to help you memorize the Holy Quran systematically and effectively.
                    It adapts to your pace, tracks your progress, and provides structured methods to ensure retention.
                </p>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    Our goal is to make the noble task of Hifz accessible and manageable for everyone, regardless of their schedule or prior experience.
                </p>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                How to Use Al-Hafiz
            </h3>

            <div className="glass-panel" style={{ padding: '25px', marginBottom: '30px' }}>
                <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    <li style={{ marginBottom: '10px' }}>
                        <strong style={{ color: 'white' }}>Configure Your Settings:</strong> Start by visiting the Settings page to choose your memorization plan, learning style, and preferred reciter.
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                        <strong style={{ color: 'white' }}>Start a Session:</strong> On the Home screen, click <strong>"Resume Session"</strong>. This will take you to your daily verses.
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                        <strong style={{ color: 'white' }}>Memorize:</strong> Follow the on-screen instructions. You can listen to the recitation, read the verses, and toggle the translation.
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                        <strong style={{ color: 'white' }}>Complete Your Daily Goal:</strong> Once you are confident, mark the session as complete. Your progress and streak will update automatically.
                    </li>
                    <li>
                        <strong style={{ color: 'white' }}>Track Progress:</strong> Check the Home dashboard to see your total memorized verses, current streak, and progress towards your completion goal.
                    </li>
                </ol>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                Understanding the Settings
            </h3>

            <div style={{ display: 'grid', gap: '20px' }}>

                {/* Memorization Plan Type */}
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <Activity size={24} color="var(--accent)" />
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Memorization Plan Type</h4>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem' }}>
                        Choose how you want to structure your memorization journey.
                    </p>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        <li style={{ marginBottom: '10px' }}>
                            <strong style={{ color: 'white' }}>Duration Based:</strong> Ideal if you have a deadline. Select a timeframe (e.g., 1 Year, 2 Years), and the app will calculate how many verses you need to memorize daily to meet that goal.
                        </li>
                        <li>
                            <strong style={{ color: 'white' }}>Custom Plan:</strong> Perfect for flexibility. You decide exactly how many verses to memorize per day and which Surah to start from.
                        </li>
                    </ul>
                </div>

                {/* Learning Style */}
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <Layers size={24} color="var(--primary)" />
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Learning Style</h4>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem' }}>
                        Select the method that best suits your learning habits.
                    </p>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        <li style={{ marginBottom: '10px' }}>
                            <strong style={{ color: 'white' }}>Standard:</strong> A flexible approach where you read, listen, and repeat verses at your own pace until you feel confident.
                        </li>
                        <li>
                            <strong style={{ color: 'white' }}>6446 Method:</strong> A structured, proven technique for strong retention:
                            <br />
                            1. Read the verse <strong>6 times</strong> while looking.
                            <br />
                            2. Recite it <strong>4 times</strong> from memory.
                            <br />
                            3. Read it <strong>4 times</strong> while looking again.
                            <br />
                            4. Recite it <strong>6 times</strong> from memory.
                        </li>
                    </ul>
                </div>

                {/* Verses Display Mode */}
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <Settings size={24} color="#3B82F6" />
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Verses Display Mode</h4>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem' }}>
                        Control how much content you see on the screen during your session.
                    </p>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        <li style={{ marginBottom: '10px' }}>
                            <strong style={{ color: 'white' }}>Specific Number:</strong> Focuses your attention by showing only a small set of verses (e.g., 5 verses) at a time. Great for avoiding overwhelm.
                        </li>
                        <li>
                            <strong style={{ color: 'white' }}>Entire Surah:</strong> Displays the full Surah. Useful for context and revising larger sections.
                        </li>
                    </ul>
                </div>

                {/* Reciter & Translation */}
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <Mic size={24} color="#EC4899" />
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Reciter & Translation</h4>
                    </div>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        <li style={{ marginBottom: '10px' }}>
                            <strong style={{ color: 'white' }}>Preferred Reciter:</strong> Choose from a list of world-renowned Qaris. Listening to a reciter helps with proper pronunciation (Tajweed) and memorization.
                        </li>
                        <li>
                            <strong style={{ color: 'white' }}>Translation Language:</strong> Select your preferred language to understand the meaning of the verses you are memorizing, which aids in retention and contemplation (Tadabbur).
                        </li>
                    </ul>
                </div>

            </div>

            <HadithFooter />
        </div>
    );
};

export default Tutorial;
