import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import ChatWidget from './ChatWidget';

import './Navbar.css';

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const panelRef = useRef(null);
	const lastActiveRef = useRef(null);
	const headerRef = useRef(null);
	const [sticky, setSticky] = useState(false);
	const [spacerHeight, setSpacerHeight] = useState(0);

	useEffect(() => {
		const onKey = (e) => {
			if (e.key === 'Escape') setOpen(false);
			if (e.key === 'Tab' && open && panelRef.current) {
				// simple focus trap
				const focusable = panelRef.current.querySelectorAll('a,button,input,textarea,select');
				if (focusable.length === 0) return;
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};

		const onClickOutside = (e) => {
			if (open && panelRef.current && !panelRef.current.contains(e.target)) {
				setOpen(false);
			}
		};

		document.addEventListener('keydown', onKey);
		document.addEventListener('click', onClickOutside);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('click', onClickOutside);
		};
	}, [open]);

		// sticky on scroll
		useEffect(() => {
			let raf = null;
			const threshold = 60; // px before sticking
			const handle = () => {
				if (raf) cancelAnimationFrame(raf);
				raf = requestAnimationFrame(() => {
					const y = window.scrollY || window.pageYOffset;
					const should = y > threshold;
					if (should !== sticky) {
						setSticky(should);
						// compute spacer height when becoming sticky
						const h = headerRef.current ? headerRef.current.getBoundingClientRect().height : 0;
						setSpacerHeight(should ? h : 0);
					}
				});
			};
			window.addEventListener('scroll', handle, { passive: true });
			// on mount compute header height
			const initialH = headerRef.current ? headerRef.current.getBoundingClientRect().height : 0;
			setSpacerHeight(0);
			return () => {
				window.removeEventListener('scroll', handle);
				if (raf) cancelAnimationFrame(raf);
			};
		}, [sticky]);

	useEffect(() => {
		if (open) {
			lastActiveRef.current = document.activeElement;
			// lock scroll
			document.body.style.overflow = 'hidden';
			// focus first element in panel
			setTimeout(() => {
				const focusable = panelRef.current?.querySelectorAll('a,button,input,textarea,select');
				if (focusable && focusable.length) focusable[0].focus();
			}, 0);
		} else {
			document.body.style.overflow = '';
			try {
				lastActiveRef.current?.focus();
			} catch (e) {
				// ignore
			}
		}
	}, [open]);

	return (
			<>
				<header ref={headerRef} className={`site-navbar ${sticky ? 'is-sticky' : ''}`} role="banner">
					<div className="nav-inner container">
					<div className="brand">
						<Link to="/" className="brand-link">
							<img src="/logo192.png" alt="logo" className="brand-logo" />
							<span className="brand-title">Ndaku</span>
						</Link>
					</div>

					<nav className="nav-desktop" aria-label="Main navigation">
						<Link to="/" className="nav-link">Home</Link>
						<Link to="/agents" className="nav-link">Agents</Link>
						<Link to="/properties" className="nav-link">Properties</Link>
						<Link to="/subscriptions" className="nav-link">Subscriptions</Link>
						<Link to="/contact" className="nav-link">Contact</Link>
						<Link to="/login" className="nav-cta">Connexion</Link>
					</nav>

								<button
									aria-label={open ? 'Close menu' : 'Open menu'}
									className="nav-toggle"
									onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
									onMouseDown={(e) => e.preventDefault()}
									aria-expanded={open}
									aria-controls="mobile-menu"
								>
									{open ? <FaTimes /> : <FaBars />}
								</button>
				</div>
			</header>
			{/* spacer to prevent content jump when navbar becomes fixed */}
			{sticky && <div style={{ height: spacerHeight }} aria-hidden="true" />}

			<aside
				id="mobile-menu"
				ref={panelRef}
				className={`mobile-panel ${open ? 'open' : ''}`}
				aria-hidden={!open}
			>
				<nav className="mobile-nav" aria-label="Mobile navigation">
					<Link to="/" className="mobile-link" onClick={() => setOpen(false)}>Home</Link>
					<Link to="/agents" className="mobile-link" onClick={() => setOpen(false)}>Agents</Link>
					<Link to="/properties" className="mobile-link" onClick={() => setOpen(false)}>Properties</Link>
					<Link to="/subscriptions" className="mobile-link" onClick={() => setOpen(false)}>Subscriptions</Link>
					<Link to="/contact" className="mobile-link" onClick={() => setOpen(false)}>Contact</Link>
					<div className="mobile-actions">
						<Link to="/login" className="mobile-cta" onClick={() => setOpen(false)}>Connexion</Link>
					</div>
				</nav>
			</aside>

			{/* keep chat widget mounted globally */}
			<ChatWidget />
		</>
	);
}

