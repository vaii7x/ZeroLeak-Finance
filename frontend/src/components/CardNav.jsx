import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import './CardNav.css';

const ArrowUpRight = ({ className = '' }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const CardNav = ({
  logo,
  logoAlt = 'ZeroLeak Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#0D1512',
  menuColor = '#72D6A0',
  buttonBgColor = '#F1F3EF',
  buttonTextColor = '#070B09',
  buttonText = 'Create Account',
  buttonHref = '/signup',
  showAuth = false,
  rightElement = null
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 270;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 270;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 40, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.38,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.35, ease, stagger: 0.07 }, '-=0.15');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`.trim()}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
              }
            }}
            role="button"
            aria-label={isExpanded ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isExpanded}
            tabIndex={0}
            style={{ color: menuColor }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <Link to="/" className="logo-container group">
            {logo ? (
              <img src={logo} alt={logoAlt} className="logo" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0] group-hover:scale-125 transition-transform" />
                <span className="font-headline font-bold text-base tracking-tight text-[#F1F3EF]">
                  ZeroLeak
                </span>
                <span className="font-mono text-[9px] tracking-[0.2em] text-[#8D9A93] uppercase pl-1.5 border-l border-[#1C2923]">
                  FINANCE
                </span>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-3">
            {showAuth ? (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block font-mono text-xs uppercase tracking-wider text-[#8D9A93] hover:text-[#F1F3EF] px-2 py-1 transition-colors"
                >
                  Log in
                </Link>
                {buttonText && (
                  <Link
                    to={buttonHref}
                    className="card-nav-cta-button"
                    style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                  >
                    {buttonText}
                  </Link>
                )}
              </>
            ) : rightElement ? (
              rightElement
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#163D2D]/40 border border-[#72D6A0]/30 text-[#72D6A0] text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse" />
                <span className="hidden sm:inline">Enclave Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor || '#070B09', color: item.textColor || '#F1F3EF' }}
            >
              <div className="nav-card-label" style={{ color: item.labelColor || '#F1F3EF' }}>
                {item.label}
              </div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => {
                  const isInternal = lnk.href && lnk.href.startsWith('/');
                  return isInternal ? (
                    <Link
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      to={lnk.href}
                      aria-label={lnk.ariaLabel || lnk.label}
                      onClick={() => {
                        if (isExpanded) toggleMenu();
                      }}
                    >
                      <ArrowUpRight className="nav-card-link-icon" />
                      <span>{lnk.label}</span>
                    </Link>
                  ) : (
                    <a
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      href={lnk.href || '#'}
                      aria-label={lnk.ariaLabel || lnk.label}
                      target={lnk.external ? '_blank' : undefined}
                      rel={lnk.external ? 'noopener noreferrer' : undefined}
                    >
                      <ArrowUpRight className="nav-card-link-icon" />
                      <span>{lnk.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
