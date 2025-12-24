import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import headerImg from '../assets/header.jpg';
import grandmaImg from '../assets/archetypes/grandma.jpg';
import structuralImg from '../assets/archetypes/structural_engineer.jpg';
import sauceImg from '../assets/archetypes/sauce_scientist.jpg';
import proteinImg from '../assets/archetypes/protein_purist.jpg';
import cleanerImg from '../assets/archetypes/plate_cleaner.jpg';
import vacationerImg from '../assets/archetypes/vacationer.jpg';
import scannerImg from '../assets/archetypes/scanner.jpg';
import toddlerImg from '../assets/archetypes/toddler.jpg';
import { BADGES } from '../constants/badges';

const BuffetBingo = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scoreInputs, setScoreInputs] = useState({
    taste: '',
    cohesion: '',
    regret: '',
    waste: ''
  });
  const [finalScore, setFinalScore] = useState(null);
  const [missionModal, setMissionModal] = useState(null);

  // --- Logic ---

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleScoreChange = (e) => {
    const { id, value } = e.target;
    // Map input IDs to state keys
    const key = id.replace('score-', '');
    setScoreInputs(prev => ({ ...prev, [key]: value }));
  };

  const calculateScore = (e) => {
    e.preventDefault();
    const taste = parseFloat(scoreInputs.taste);
    const cohesion = parseFloat(scoreInputs.cohesion);
    const regret = parseFloat(scoreInputs.regret);
    const waste = parseFloat(scoreInputs.waste);

    if (isNaN(taste) || isNaN(cohesion) || isNaN(regret) || isNaN(waste)) return;

    // Formula: (Taste + Cohesion + (11 - Regret) + (11 - Waste)) / 4
    const inverseRegret = 11 - regret;
    const inverseWaste = 11 - waste;
    
    let total = (taste + cohesion + inverseRegret + inverseWaste) / 4;
    total = Math.round(total * 10) / 10;

    let comment = "";
    if (total >= 9) comment = "🏆 Grandmaster of the Galley!";
    else if (total >= 7.5) comment = "👏 A Master of Shadows.";
    else if (total >= 5) comment = "😐 Acceptable Fate. But finish your greens.";
    else comment = "🤢 Disgraceful. The Buffet Gods are displeased.";

    setFinalScore({ total, comment });
  };

  const generateBingoCard = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const archetypes = [
        "Structural Engineer", "Sauce Scientist", "Grandma", 
        "Protein Purist", "Plate-Cleaner", "Vacationer", "Scanner"
    ];
    
    const modifiers = [
        "but double the sauce",
        "but arrange everything symmetrically",
        "and eat with your non-dominant hand",
        "but skip the carbs",
        "and add a random dessert item",
        "while maintaining 'Ghost Protocol'",
        "but you must finish in under 8 minutes",
        "and rate every bite out loud",
        "but only take items that are round",
        "and take the exact same drink"
    ];

    const staticMissions = [
        "The Monochromatic Challenge: Your entire plate must be one color family.",
        "The Tower of Babel: Build a salad at least 4 inches high.",
        "Dessert First: Start with a full dessert plate, then proceed to dinner.",
        "The Texture Nightmare: Combine crunchy, slimy, and hot items on one plate.",
        "International Waters: Put items from 3 different cuisines on one plate.",
        "The Minimalist: Create a beautiful plate with only 3 items, widely spaced.",
        "Sauce Boss: Create a dipping sauce using at least 4 different condiments.",
        "The Zero Waste Mission: Earn 'Finishing Move' this round.",
        "Find the person with the fullest plate and mirror their most precarious item."
    ];

    let mission;
    if (Math.random() > 0.4) {
        mission = `Find a ${pick(archetypes)} and mirror their plate, ${pick(modifiers)}.`;
    } else {
        mission = pick(staticMissions);
    }

    setMissionModal(mission);
  };

  const createPreGameTemplate = (e) => {
    e.preventDefault();
    const rowsCount = 10;
    
    const badgeHtml = BADGES.map(b => `
        <div class="badge-item">
            <i class="${b.icon}" style="color:#e11d48; width:20px; text-align:center;"></i>
            <span>${b.name}</span>
        </div>
    `).join('');

    const tableRows = Array.from({length: rowsCount}).map((_,i) => {
        return `
        <tr>
            <td style="text-align:center; color:#94a3b8; font-weight:bold;">${i+1}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td style="background-color:#fff1f2;"></td>
        </tr>`;
    }).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Buffet Bingo Scorecard</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 0; }
                body { font-family: 'Roboto', sans-serif; margin: 0; padding: 40px; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .container { max-width: 800px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; height: 90vh; box-sizing: border-box; position: relative; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                .brand { font-family: 'Fredoka', sans-serif; font-size: 32px; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; }
                .subtitle { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 700; margin-bottom: 20px; }
                .meta { display: flex; justify-content: center; gap: 40px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background-color: #e11d48; color: white; padding: 12px 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: center; }
                th:first-child { border-top-left-radius: 8px; }
                th:last-child { border-top-right-radius: 8px; }
                td { border-bottom: 1px solid #e2e8f0; padding: 12px 8px; font-size: 14px; }
                tr:last-child td { border-bottom: none; }
                tr:nth-child(even) { background-color: #f8fafc; }
                th:nth-child(1) { width: 40px; }
                th:nth-child(2) { text-align: left; padding-left: 16px; }
                td:nth-child(2) { padding-left: 16px; }
                .formula-box { background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 12px; color: #475569; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1; }
                .legend-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #cbd5e1; }
                .legend-item { text-align: center; font-size: 11px; line-height: 1.4; }
                .legend-item strong { display: block; color: #0f172a; font-weight: 700; }
                .badges-section { margin-top: auto; }
                .badges-title { font-family: 'Fredoka', sans-serif; font-size: 18px; margin-bottom: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .badge-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .badge-item { display: flex; align-items: center; font-size: 11px; color: #475569; }
                @media print{ body { padding: 0; margin: 0; } .container { border: none; height: 100%; border-radius: 0; padding: 20mm; } }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="brand"><i class="fas fa-utensils" style="color:#e11d48; margin-right:10px;"></i>Buffet Bingo</div>
                    <div class="subtitle">Official Scorecard</div>
                    <div class="meta"><div><strong>Date:</strong> ________________</div><div><strong>Location:</strong> ___________________________________</div></div>
                </div>
                <table>
                    <thead><tr><th>#</th><th>Player Name</th><th>Taste</th><th>Cohesion</th><th>Regret</th><th>Waste</th><th>Total</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="formula-box">
                    <div style="margin-bottom:12px"><strong>Scoring Formula:</strong> (Taste + Cohesion + (11 - Regret) + (11 - Waste)) / 4</div>
                    <div class="legend-grid">
                        <div class="legend-item"><strong>Taste</strong>10 = Delicious<br>1 = Inedible</div>
                        <div class="legend-item"><strong>Cohesion</strong>10 = Perfect Theme<br>1 = Chaos</div>
                        <div class="legend-item"><strong>Regret</strong>1 = No Regrets (Best)<br>10 = Deep Shame</div>
                        <div class="legend-item"><strong>Waste</strong>1 = Clean Plate (Best)<br>10 = Full Plate</div>
                    </div>
                </div>
                <div class="badges-section">
                    <div class="badges-title">Achievement Badges</div>
                    <div class="badge-grid">${badgeHtml}</div>
                </div>
            </div>
        </body>
        </html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const archetypesList = [
    {
      name: "The Grandma",
      desc: "She knows exactly which casserole is homemade and which came from a bag. Follow her for comfort food, but be prepared to eat dinner at 4:30 PM. If she takes the green Jell-O, you take the green Jell-O.",
      img: grandmaImg,
      titleColor: "text-rose-400",
      borderColor: "hover:border-rose-500"
    },
    {
      name: "The Structural Engineer",
      desc: "Masters of gravity who treat the salad bar like a high-stakes game of Tetris. Expect a precarious tower of onion rings balanced on a load-bearing slice of ham. Do not sneeze near their plate.",
      img: structuralImg,
      titleColor: "text-blue-400",
      borderColor: "hover:border-blue-500"
    },
    {
      name: "The Sauce Scientist",
      desc: "They aren't here for food; they are conducting chemistry experiments with ranch and sriracha. You will be dipping pizza into a mixture that looks like radioactive sludge. Hope you brought your safety goggles.",
      img: sauceImg,
      titleColor: "text-amber-500",
      borderColor: "hover:border-amber-500"
    },
    {
      name: "The Protein Purist",
      desc: "Vegetables are a myth to this carnivore. They will bankrupt the restaurant with a mountain of crab legs and prime rib. Your sodium levels will be critical, but your ROI will be legendary.",
      img: proteinImg,
      titleColor: "text-emerald-500",
      borderColor: "hover:border-emerald-500"
    },
    {
      name: "The Plate-Cleaner",
      desc: "They take three peas and a crouton, eat them, and immediately return to the line. You will walk a marathon tonight just trying to keep up. Cardio is unfortunately included in the price.",
      img: cleanerImg,
      titleColor: "text-purple-500",
      borderColor: "hover:border-purple-500"
    },
    {
      name: "The Vacationer",
      desc: "A plate of pure anarchy where sushi touches lasagna next to a waffle. They have no plan, no boundaries, and absolutely no fear of food poisoning. Tastes like expensive confusion.",
      img: vacationerImg,
      titleColor: "text-orange-500",
      borderColor: "hover:border-orange-500"
    },
    {
      name: "The Scanner",
      desc: "They circle the buffet perimeter three times like a shark before picking up a single plate. You will starve while they analyze the moisture content of the mac and cheese. Patience is your only utensil.",
      img: scannerImg,
      titleColor: "text-sky-500",
      borderColor: "hover:border-sky-500"
    },
    {
      name: "The Toddler",
      desc: "The most dangerous game. You will end up with one chicken nugget, a lemon wedge, and a handful of crackers. Do not follow unless you want to leave hungry and confused.",
      img: toddlerImg,
      titleColor: "text-red-600",
      borderColor: "hover:border-red-600",
      descClass: "text-red-400 font-bold"
    }
  ];

  return (
    <div className="text-gray-800 font-sans bg-slate-50">
        {/* External Dependencies (Ensure these are loaded in your index.html or via Helmet) */}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet" />
        
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center">
                        <i className="fas fa-utensils text-rose-600 text-2xl mr-2"></i>
                        <span className="text-2xl font-bold text-gray-900 brand-font">Buffet Bingo</span>
                    </Link>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/hall-of-fame" className="nav-link text-gray-600 hover:text-rose-600 font-medium">Hall of Fame</Link>
                        <a href="#rules" className="nav-link text-gray-600 hover:text-rose-600 font-medium">Rules</a>
                        <a href="#scouting" className="nav-link text-gray-600 hover:text-rose-600 font-medium">Scouting</a>
                        <a href="#badges" className="nav-link text-gray-600 hover:text-rose-600 font-medium">Badges</a>
                        <a href="#ethics" className="nav-link text-gray-600 hover:text-rose-600 font-medium">Ninja Code</a>
                        <a href="#" onClick={createPreGameTemplate} className="nav-link text-gray-600 hover:text-rose-600 font-medium">Download Scorecard</a>
                        <Link to="/play" className="bg-rose-600 text-white px-4 py-2 rounded-full hover:bg-rose-700 transition shadow-lg">Play Now</Link>
                    </div>
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={toggleMenu}
                            className="text-gray-600 hover:text-rose-600 focus:outline-none" 
                            aria-label="Toggle navigation menu" 
                            aria-expanded={isMobileMenuOpen}
                        >
                            <i className="fas fa-bars text-2xl"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div id="mobile-menu" className={`md:hidden bg-white shadow-lg border-t ${isMobileMenuOpen ? 'open' : ''}`}>
                <Link to="/hall-of-fame" onClick={closeMenu} className="block py-2 px-4 text-sm hover:bg-gray-100">Hall of Fame</Link>
                <a href="#rules" onClick={closeMenu} className="block py-2 px-4 text-sm hover:bg-gray-100">Rules</a>
                <a href="#scouting" onClick={closeMenu} className="block py-2 px-4 text-sm hover:bg-gray-100">Scouting</a>
                <a href="#badges" onClick={closeMenu} className="block py-2 px-4 text-sm hover:bg-gray-100">Badges</a>
                <a href="#ethics" onClick={closeMenu} className="block py-2 px-4 text-sm hover:bg-gray-100">Ninja Code</a>
                <a href="#" onClick={(e) => { closeMenu(); createPreGameTemplate(e); }} className="block py-2 px-4 text-sm hover:bg-gray-100">Download Scorecard</a>
                <Link to="/play" onClick={closeMenu} className="block py-2 px-4 text-sm text-rose-600 font-bold hover:bg-gray-100">Play Now</Link>
            </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-image">
            <div className="max-w-[1000px] mx-auto">
                <img src={headerImg} alt="Buffet Bingo header" className="w-full h-auto block shadow-2xl rounded-2xl" />
            </div>
        </section>

        {/* Banner Actions */}
        <section className="banner-actions px-4 text-center">
            <div className="max-w-4xl mx-auto py-6">
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a href="#rules" className="bg-white text-rose-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg">Read the Rules</a>
                    <Link to="/play" className="bg-rose-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-rose-700 transition shadow-lg">
                        Play Now
                    </Link>
                    <button onClick={generateBingoCard} className="border-2 border-rose-600 text-rose-600 bg-white px-8 py-3 rounded-full font-bold text-lg hover:bg-rose-50 hover:text-rose-700 transition shadow-lg">
                        <i className="fas fa-dice mr-2"></i> Random Challenge
                    </button>
                </div>
            </div>
        </section>

        {/* The Pitch Section */}
        <section className="pb-16 bg-rose-50 border-b border-rose-100">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-rose-900 mb-6 brand-font italic">"Wait... You want me to follow a stranger?"</h2>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                        Let’s face it: left to your own devices, you’re a boring eater. You walk into a buffet and immediately go for the "safe" dinner roll and the lukewarm pasta you've had a thousand times. <b>Buffet Bingo</b> is the ultimate cure for choice paralysis. By outsourcing your culinary destiny to a total stranger, you turn a Tuesday night dinner into a high-stakes safari of flavor.
                    </p>
                    <p>
                        Will your "Guide" lead you to a hidden 10/10 homemade peach cobbler, or will you end up staring down a precarious pile of shrimp cocktail balanced on a slice of pepperoni pizza? Only the tongs of fate can decide. Grab your friends, pin on your secret badge, and prepare for the most fun you can have with communal serving spoons.
                    </p>
                    <p><b>It’s time to eat a meal that literally isn't your own.</b></p>
                </div>
                <div className="mt-8 flex justify-center">
                    <div className="h-1 w-24 bg-rose-600 rounded-full"></div>
                </div>
            </div>
        </section>

        {/* Rules Grid */}
        <section id="rules" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="text-rose-600 font-bold tracking-wider uppercase text-sm">How to Play</span>
                    <h2 className="text-4xl font-bold text-gray-900 mt-2">The Official Rule Book</h2>
                </div>
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center card-hover">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><i className="fas fa-crosshairs"></i></div>
                        <h3 className="font-bold mb-2">1. Target Lock</h3>
                        <p className="text-sm text-gray-600">Pick a Guide (stranger) before they plate their first item.</p>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center card-hover">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><i className="fas fa-user-secret"></i></div>
                        <h3 className="font-bold mb-2">2. The Shadow</h3>
                        <p className="text-sm text-gray-600">Copy their plate exactly. Same items, same portions.</p>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center card-hover">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><i className="fas fa-utensils"></i></div>
                        <h3 className="font-bold mb-2">3. The Feast</h3>
                        <p className="text-sm text-gray-600">The 3-Bite Rule: You must eat 3 bites of everything.</p>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center card-hover">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><i className="fas fa-check-circle"></i></div>
                        <h3 className="font-bold mb-2">4. The Score</h3>
                        <p className="text-sm text-gray-600">Rate your experience. Highest score wins the round.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Scouting Archetypes */}
        <section id="scouting" className="py-20 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="text-rose-400 font-bold tracking-wider uppercase text-sm">Strategy</span>
                    <h2 className="text-4xl font-bold mt-2">Guide Archetypes</h2>
                </div>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {archetypesList.map((archetype, idx) => (
                        <div key={idx} className={`bg-slate-800 p-6 rounded-xl border border-slate-700 ${archetype.borderColor} transition flex flex-col`}>
                            <div className="h-40 mb-4 overflow-hidden rounded-lg bg-slate-700">
                                <img src={archetype.img} alt={archetype.name} className="w-full h-full object-cover hover:scale-110 transition duration-500" />
                            </div>
                            <h3 className={`text-lg font-bold ${archetype.titleColor} mb-2`}>{archetype.name}</h3>
                            <p className={`text-xs ${archetype.descClass || 'text-slate-300'}`}>{archetype.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Achievements Section */}
        <section id="badges" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12 uppercase brand-font tracking-widest">Achievement Hall</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {BADGES.map((badge, idx) => (
                        <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm text-center border border-gray-100 card-hover ${badge.name === 'The Toddler Trap' ? 'border-red-200' : ''} ${badge.name === 'Finishing Move' ? 'bg-emerald-50' : ''}`}>
                            <i className={`${badge.icon} text-2xl mb-2 ${badge.color}`}></i>
                            <h4 className="font-bold text-sm">{badge.name}</h4>
                            <p className="text-[10px] text-gray-500">
                                {badge.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Ninja Code Section */}
        <section id="ethics" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-slate-50 border border-slate-100 p-10 rounded-3xl shadow-xl shadow-slate-200/50">
                    <h2 className="text-3xl font-bold mb-10 flex items-center brand-font text-slate-900">
                        <i className="fas fa-user-ninja text-rose-600 mr-4"></i>
                        The Ninja Code of Ethics
                    </h2>
                    <ul className="space-y-6">
                        <li className="flex items-start">
                            <div className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-4 mt-1"><i className="fas fa-ruler-horizontal"></i></div>
                            <div>
                                <strong className="text-lg">The 1.5-Meter Rule</strong>
                                <p className="text-gray-600">Never crowd your Guide. If you can smell their perfume or hear them humming, you are too close. Maintain the "Creep Buffer."</p>
                            </div>
                        </li>
                        <li className="flex items-start">
                            <div className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-4 mt-1"><i className="fas fa-eye-slash"></i></div>
                            <div>
                                <strong className="text-lg">No Eye Contact</strong>
                                <p className="text-gray-600">If they turn around, you must immediately pivot toward the nearest sneeze guard and act like you are agonizing over choice.</p>
                            </div>
                        </li>
                        <li className="flex items-start">
                            <div className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-4 mt-1"><i className="fas fa-hand-holding-heart"></i></div>
                            <div>
                                <strong className="text-lg">The "No Sabotage" Clause</strong>
                                <p className="text-gray-600">You may not nudge or distract your Guide to influence their choices. You are a shadow, not a villain.</p>
                            </div>
                        </li>
                        <li className="flex items-start">
                            <div className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-4 mt-1"><i className="fas fa-shield-alt"></i></div>
                            <div>
                                <strong className="text-lg">Respect the Staff</strong>
                                <p className="text-gray-600">Do not block paths. If a server asks if they can help, say "I'm just taking it all in."</p>
                            </div>
                        </li>
                        <li className="flex items-start">
                            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mr-4 mt-1"><i className="fas fa-leaf"></i></div>
                            <div>
                                <strong className="text-lg text-emerald-700">The Zero Waste Protocol</strong>
                                <p className="text-gray-600">A true Ninja leaves no trace. Do not take massive portions only to throw them away. Every gram of food left behind penalizes your final score.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        {/* Digital Scorecard */}
        <section id="scorecard" className="py-24 bg-rose-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiZmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-20"></div>
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-8 uppercase brand-font tracking-widest">Digital Scorecard</h2>
                <form onSubmit={calculateScore} className="bg-white text-gray-900 p-8 md:p-12 rounded-3xl shadow-2xl relative z-10">
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-slate-700">Taste Quality (1-10)</label>
                            <input type="number" id="score-taste" value={scoreInputs.taste} onChange={handleScoreChange} min="1" max="10" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-slate-700">Plate Cohesion (1-10)</label>
                            <input type="number" id="score-cohesion" value={scoreInputs.cohesion} onChange={handleScoreChange} min="1" max="10" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" required />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-slate-700">Regret Level (1-10)</label>
                            <input type="number" id="score-regret" value={scoreInputs.regret} onChange={handleScoreChange} min="1" max="10" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" placeholder="1 = No Regrets" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-rose-600">Leftovers Penalty (1-10)</label>
                            <input type="number" id="score-waste" value={scoreInputs.waste} onChange={handleScoreChange} min="1" max="10" className="w-full p-4 border border-rose-200 rounded-xl bg-rose-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" placeholder="1 = Clean Plate" required />
                            <p className="text-[10px] text-rose-400 mt-1">*Higher waste reduces your rank.</p>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">Calculate Final Rank</button>
                    
                    {finalScore && (
                        <div id="result-display" className="mt-8 text-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Official Shadow Score</p>
                            <div id="final-score" className="text-5xl font-bold text-rose-600 my-2">{finalScore.total}/10</div>
                            <p id="score-comment" className="text-gray-700 font-medium italic">{finalScore.comment}</p>
                        </div>
                    )}
                </form>
            </div>
        </section>

        {/* Scoring Algorithm Explanation */}
        <section className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-10 brand-font">The Science of the Score</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="flex items-start">
                        <div className="text-rose-600 mr-4"><i className="fas fa-flask text-2xl"></i></div>
                        <div>
                            <h3 className="font-bold mb-1">Standard 10-Point Average</h3>
                            <p className="text-sm text-gray-600">Your final Shadow Score is a simple average of four metrics. Each category contributes exactly 25% to the final result.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="text-rose-600 mr-4"><i className="fas fa-calculator text-2xl"></i></div>
                        <div>
                            <h3 className="font-bold mb-1">The Inverse Balance</h3>
                            <p className="text-sm text-gray-600">Metrics like <strong>Regret</strong> and <strong>Waste</strong> are inversed (11 minus your input). This ensures that a "1" in waste correctly results in a high score.</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-center">The Equation</h3>
                    <div className="flex flex-col items-center text-sm md:text-base font-mono bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                        <div className="flex flex-wrap justify-center items-center gap-3 pb-3 w-full">
                            <span className="bg-blue-100 px-2 py-1 rounded">Taste</span>
                            <span className="text-gray-400">+</span>
                            <span className="bg-purple-100 px-2 py-1 rounded">Cohesion</span>
                            <span className="text-gray-400">+</span>
                            <span className="bg-green-100 px-2 py-1 rounded">(11 - Regret)</span>
                            <span className="text-gray-400">+</span>
                            <span className="bg-rose-100 px-2 py-1 rounded">(11 - Waste)</span>
                        </div>
                        <div className="w-full border-t-2 border-gray-300"></div>
                        <div className="pt-2 font-bold text-lg text-gray-600">4</div>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-4 italic">The result is rounded to the nearest tenth.</p>
                </div>
            </div>
        </section>

        <footer className="bg-slate-900 text-slate-500 py-12 text-center text-sm">
            <div className="max-w-7xl mx-auto px-4">
                <i className="fas fa-utensils text-2xl text-rose-600 mb-4"></i>
                <p className="text-white font-bold mb-2">Buffet Bingo Global</p>
                <p>Eat like a shadow. Move like the wind.</p>
            </div>
        </footer>

        {/* Modal */}
        {missionModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                <div className="bg-white p-8 rounded-2xl text-center max-w-sm">
                    <i className="fas fa-dice text-4xl text-rose-600 mb-4"></i>
                    <h3 className="text-xl font-bold mb-4">New Mission</h3>
                    <p className="text-gray-600 italic mb-6">{missionModal}</p>
                    <button onClick={() => setMissionModal(null)} className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold">Accept Mission</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default BuffetBingo;
