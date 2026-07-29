import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import "./SwipeableRow.css";

export interface SwipeAction {
	id: string;
	label: string;
	icon?: React.ReactNode;
	onClick: () => void;
	backgroundColor?: string;
	color?: string;
}

interface SwipeableRowProps {
	children: React.ReactNode;
	leadingActions?: SwipeAction[];
	trailingActions?: SwipeAction[];
	actionWidth?: number;
	swipeThreshold?: number;
}

export default function SwipeableRow({
	children,
	leadingActions = [],
	trailingActions = [],
	actionWidth = 80,
	swipeThreshold = 40,
}: SwipeableRowProps) {
	const x = useMotionValue(0);
	const prefersReducedMotion = useReducedMotion();
	const containerRef = useRef<HTMLDivElement>(null);
	const [isOpen, setIsOpen] = useState<"leading" | "trailing" | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);

	const leadingWidth = leadingActions.length * actionWidth;
	const trailingWidth = trailingActions.length * actionWidth;

	// Bounding constraints
	const leftBound = trailingActions.length > 0 ? -trailingWidth : 0;
	const rightBound = leadingActions.length > 0 ? leadingWidth : 0;

	const handleDragEnd = (event: any, info: any) => {
		const currentX = x.get();
		const velocity = info.velocity.x;

		let targetX = 0;
		let nextState: "leading" | "trailing" | null = null;

		if (currentX > swipeThreshold || (currentX > 0 && velocity > 200)) {
			if (leadingActions.length > 0) {
				targetX = leadingWidth;
				nextState = "leading";
			}
		} else if (currentX < -swipeThreshold || (currentX < 0 && velocity < -200)) {
			if (trailingActions.length > 0) {
				targetX = -trailingWidth;
				nextState = "trailing";
			}
		}

		setIsOpen(nextState);
		
		animate(x, targetX, {
			type: "spring",
			stiffness: 400,
			damping: 30,
			duration: prefersReducedMotion ? 0 : undefined,
		});
	};

	const closeSwipe = () => {
		setIsOpen(null);
		animate(x, 0, {
			type: "spring",
			stiffness: 400,
			damping: 30,
			duration: prefersReducedMotion ? 0 : undefined,
		});
	};

	// Use effect to close swipe when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent | TouchEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				if (isOpen) closeSwipe();
				if (menuOpen) setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("touchstart", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, [isOpen, menuOpen]);

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			if (e.target === containerRef.current) {
				e.preventDefault();
				setMenuOpen((prev) => !prev);
			}
		} else if (e.key === "Escape") {
			setMenuOpen(false);
			closeSwipe();
		}
	};

	const renderAction = (action: SwipeAction) => (
		<button
			key={action.id}
			className="swipe-action-btn"
			style={{ backgroundColor: action.backgroundColor, color: action.color, width: actionWidth }}
			onClick={(e) => {
				e.stopPropagation();
				action.onClick();
				closeSwipe();
				setMenuOpen(false);
			}}
			aria-label={action.label}
		>
			{action.icon && <span className="swipe-action-icon" aria-hidden="true">{action.icon}</span>}
			<span className="swipe-action-label">{action.label}</span>
		</button>
	);

	const hasActions = leadingActions.length > 0 || trailingActions.length > 0;

	return (
		<div 
			className="swipeable-row-container" 
			ref={containerRef}
			role={hasActions ? "button" : undefined}
			tabIndex={hasActions ? 0 : undefined}
			onKeyDown={hasActions ? handleKeyDown : undefined}
			aria-expanded={menuOpen}
			aria-haspopup={hasActions ? "menu" : undefined}
			aria-label="Row with actions, swipe or press enter to reveal"
		>
			<div className="swipeable-actions-background">
				{leadingActions.length > 0 && (
					<div className="swipeable-actions swipeable-actions-leading">
						{leadingActions.map(renderAction)}
					</div>
				)}
				{trailingActions.length > 0 && (
					<div className="swipeable-actions swipeable-actions-trailing">
						{trailingActions.map(renderAction)}
					</div>
				)}
			</div>

			<motion.div
				className="swipeable-row-content"
				style={{ x }}
				drag={hasActions ? "x" : false}
				dragDirectionLock
				dragConstraints={{ left: leftBound, right: rightBound }}
				dragElastic={0.15} // Rubber-band effect
				onDragEnd={handleDragEnd}
				onClick={() => {
					if (isOpen) {
						closeSwipe();
					} else {
						// Don't swallow clicks if it's just the card being clicked normally
					}
				}}
			>
				{children}
			</motion.div>

			{/* Fallback keyboard menu */}
			{menuOpen && hasActions && (
				<div className="swipeable-keyboard-menu" role="menu">
					{leadingActions.map((action) => (
						<button 
							key={`menu-${action.id}`} 
							role="menuitem" 
							className="swipeable-menu-item"
							onClick={(e) => {
								e.stopPropagation();
								action.onClick();
								setMenuOpen(false);
							}}
						>
							{action.icon && <span className="swipe-action-icon" aria-hidden="true">{action.icon}</span>}
							{action.label}
						</button>
					))}
					{trailingActions.map((action) => (
						<button 
							key={`menu-${action.id}`} 
							role="menuitem" 
							className="swipeable-menu-item"
							onClick={(e) => {
								e.stopPropagation();
								action.onClick();
								setMenuOpen(false);
							}}
						>
							{action.icon && <span className="swipe-action-icon" aria-hidden="true">{action.icon}</span>}
							{action.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
