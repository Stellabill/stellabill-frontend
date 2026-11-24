import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SwipeableRow, { SwipeAction } from "./SwipeableRow";

const state = vi.hoisted(() => ({
	motionX: 0,
	pointerStartX: null as number | null,
	nextVelocity: null as number | null,
	dragEndRef: null as ((event: unknown, info: { velocity: { x: number } }) => void) | null,
	animateMock: vi.fn(),
}));

type DragEndHandler = (event: unknown, info: { velocity: { x: number } }) => void;

type MockMotionProps = Record<string, unknown> & {
	children?: React.ReactNode;
	onDragEnd?: DragEndHandler;
	drag?: unknown;
	dragDirectionLock?: unknown;
	dragConstraints?: unknown;
	dragElastic?: unknown;
	style?: unknown;
};

vi.mock("framer-motion", () => ({
	motion: {
		div: ({
			children,
			onDragEnd,
			drag,
			dragDirectionLock,
			dragConstraints,
			dragElastic,
			style,
			...props
		}: MockMotionProps) => {
			state.dragEndRef = typeof onDragEnd === "function" ? onDragEnd : null;
			return (
				<div
					data-testid="swipeable-row-content"
					data-drag={String(drag)}
					data-drag-direction-lock={String(dragDirectionLock)}
					data-drag-constraints={JSON.stringify(dragConstraints)}
					data-drag-elastic={String(dragElastic)}
					data-has-style={style ? "true" : "false"}
					{...props}
					onPointerDown={(e: React.PointerEvent) => {
						state.pointerStartX = e.clientX;
						state.motionX = 0;
					}}
					onPointerMove={(e: React.PointerEvent) => {
						if (state.pointerStartX !== null) {
							state.motionX = e.clientX - state.pointerStartX;
						}					}}
					onPointerUp={(e: React.PointerEvent) => {
							const start = state.pointerStartX;
							state.pointerStartX = null;
							const handler = state.dragEndRef;
							if (start !== null && typeof handler === "function") {
								const velocity =
									typeof state.nextVelocity === "number"
										? state.nextVelocity
										: (e.clientX - start) * 10;
								state.nextVelocity = null;
								handler(e, { velocity: { x: velocity } });
							}
						}}
					onPointerCancel={() => {
						state.pointerStartX = null;
					}}
				>
					{children}
				</div>
			);
		},
	},
	useMotionValue: () => ({
		get: () => state.motionX,
		set: (next: number) => {
			state.motionX = next;
		},
	}),
	useTransform: () => ({}),
	animate: (...args: unknown[]) => state.animateMock(...(args as [])),
	useReducedMotion: () => false,
}));

function fireSwipe(element: Element, fromX: number, toX: number, velocityX: number) {
	fireEvent.pointerDown(element, { pointerId: 1, clientX: fromX });
	fireEvent.pointerMove(element, { pointerId: 1, clientX: toX });
	state.nextVelocity = velocityX;
	fireEvent.pointerUp(element, { pointerId: 1, clientX: toX });
}

function captureRowErrors(run: () => void): unknown[] {
	const errors: unknown[] = [];
	const listener = (event: Event) => {
		errors.push((event as ErrorEvent).error);
		event.preventDefault();
	};
	window.addEventListener("error", listener);
	try {
		run();
	} finally {
		window.removeEventListener("error", listener);
	}
	return errors;
}

function createLeadingAction(overrides: Partial<SwipeAction> = {}): SwipeAction {
	return {
		id: "edit",
		label: "Edit",
		onClick: vi.fn(),
		...overrides,
	};
}

function createTrailingAction(overrides: Partial<SwipeAction> = {}): SwipeAction {
	return {
		id: "delete",
		label: "Delete",
		onClick: vi.fn(),
		...overrides,
	};
}

function renderRow(overrides: {
	leadingActions?: SwipeAction[];
	trailingActions?: SwipeAction[];
	actionWidth?: number;
	swipeThreshold?: number;
} = {}) {
	return render(
		<SwipeableRow
			leadingActions={overrides.leadingActions}
			trailingActions={overrides.trailingActions}
			actionWidth={overrides.actionWidth}
			swipeThreshold={overrides.swipeThreshold}
		>
			<div data-testid="child">Row content</div>
		</SwipeableRow>,
	);
}

const ROW_NAME = "Row with actions, swipe or press enter to reveal";

beforeEach(() => {
	state.animateMock.mockClear();
	state.motionX = 0;
	state.pointerStartX = null;
	state.nextVelocity = null;
	state.dragEndRef = null;
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("SwipeableRow initial render", () => {
	it("renders children and no button role when no actions are supplied", () => {
		renderRow();
		expect(screen.getByTestId("child")).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		expect(screen.getByTestId("swipeable-row-content")).toHaveAttribute("data-drag", "false");
	});

	it("exposes the container as a focusable button with menu semantics when actions exist", () => {
		renderRow({ leadingActions: [createLeadingAction()], trailingActions: [createTrailingAction()] });
		const container = screen.getByRole("button", { name: ROW_NAME });
		expect(container).toHaveAttribute("tabindex", "0");
		expect(container).toHaveAttribute("aria-haspopup", "menu");
		expect(container).toHaveAttribute("aria-expanded", "false");
		expect(screen.getByTestId("swipeable-row-content")).toHaveAttribute("data-drag", "x");
	});

	it("renders trailing actions in the trailing group and none in the leading group", () => {
		renderRow({ trailingActions: [createTrailingAction()] });
		expect(document.querySelector(".swipeable-actions-trailing")).toBeInTheDocument();
		expect(document.querySelector(".swipeable-actions-leading")).not.toBeInTheDocument();
	});

	it("renders leading actions in the leading group and none in the trailing group", () => {
		renderRow({ leadingActions: [createLeadingAction()] });
		expect(document.querySelector(".swipeable-actions-leading")).toBeInTheDocument();
		expect(document.querySelector(".swipeable-actions-trailing")).not.toBeInTheDocument();
	});

	it("renders one button per action with actionWidth applied to width", () => {
		renderRow({
			trailingActions: [createTrailingAction(), createTrailingAction({ id: "archive", label: "Archive" })],
			actionWidth: 120,
		});
		const buttons = screen.getAllByRole("button", { name: /Delete|Archive/ });
		expect(buttons).toHaveLength(2);
		buttons.forEach((button) => {
			expect(button).toHaveStyle({ width: "120px" });
		});
	});

	it("renders the optional icon hidden from assistive tech and the required label visible", () => {
		renderRow({ trailingActions: [createTrailingAction({ icon: <span data-testid="icon-present">trash</span> })] });
		const button = screen.getByRole("button", { name: "Delete" });
		expect(screen.getByTestId("icon-present")).toBeInTheDocument();
		expect(button.querySelector(".swipe-action-icon")).toHaveAttribute("aria-hidden", "true");
		expect(button.querySelector(".swipe-action-label")).toHaveTextContent("Delete");
	});

	it("applies optional backgroundColor and color to the action button", () => {
		renderRow({
			leadingActions: [
				createLeadingAction({ backgroundColor: "rgb(0, 128, 0)", color: "rgb(255, 255, 255)" }),
			],
		});
		expect(screen.getByRole("button", { name: "Edit" })).toHaveStyle({
			backgroundColor: "rgb(0, 128, 0)",
			color: "rgb(255, 255, 255)",
		});
	});

	it("omits the icon element entirely when the optional icon field is absent", () => {
		renderRow({ trailingActions: [createTrailingAction()] });
		expect(document.querySelectorAll(".swipe-action-icon")).toHaveLength(0);
		expect(document.querySelector(".swipe-action-label")).toBeInTheDocument();
	});
});

describe("SwipeableRow swipe transitions", () => {
	it("snaps open for leading when the swipe lands one pixel above the threshold", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 141, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 80, expect.objectContaining({ type: "spring" }));
	});

	it("snaps open for trailing when the swipe lands one pixel beyond the negative threshold", () => {
		renderRow({ trailingActions: [createTrailingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 59, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), -80, expect.objectContaining({ type: "spring" }));
	});

	it("stays closed when the swipe lands one pixel below the threshold", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 139, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("stays closed when the swipe lands exactly at the threshold", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 140, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("opens for leading on fast rightward velocity below the threshold", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 130, 250);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 80, expect.objectContaining({ type: "spring" }));
	});

	it("opens for trailing on fast leftward velocity below the threshold", () => {
		renderRow({ trailingActions: [createTrailingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 70, -250);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), -80, expect.objectContaining({ type: "spring" }));
	});

	it("snaps closed for a fast swipe toward a side with no actions", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 50, -300);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("snaps closed when movement and velocity are both zero", () => {
		renderRow({ leadingActions: [createLeadingAction()], trailingActions: [createTrailingAction()] });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 100, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("snaps open at the action width for an extreme positive swipe distance", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 100100, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 80, expect.objectContaining({ type: "spring" }));
	});

	it("snaps open at the negative action width for an extreme negative swipe distance", () => {
		renderRow({ trailingActions: [createTrailingAction()], swipeThreshold: 40 });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, -99900, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), -80, expect.objectContaining({ type: "spring" }));
	});

	it("never opens when the threshold exceeds every reachable offset", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: Number.MAX_SAFE_INTEGER });
		fireSwipe(screen.getByTestId("swipeable-row-content"), 100, 100 + 1e9, 0);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});
});

describe("SwipeableRow close and reset behavior", () => {
	it("closes when the row content is clicked while open", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		const content = screen.getByTestId("swipeable-row-content");
		fireSwipe(content, 100, 141, 0);
		fireEvent.click(content);
		expect(state.animateMock).toHaveBeenLastCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("does not animate on click when the row is closed", () => {
		renderRow({ leadingActions: [createLeadingAction()] });
		state.animateMock.mockClear();
		fireEvent.click(screen.getByTestId("swipeable-row-content"));
		expect(state.animateMock).not.toHaveBeenCalled();
	});

	it("opens the keyboard menu with Enter and sets aria-expanded to true", async () => {
		const user = userEvent.setup();
		renderRow({ leadingActions: [createLeadingAction()], trailingActions: [createTrailingAction()] });
		const container = screen.getByRole("button", { name: ROW_NAME });
		container.focus();
		await user.keyboard("{Enter}");
		expect(screen.getByRole("menu")).toBeInTheDocument();
		expect(container).toHaveAttribute("aria-expanded", "true");
	});

	it("closes the keyboard menu and resets state on Escape", async () => {
		const user = userEvent.setup();
		renderRow({ leadingActions: [createLeadingAction()], trailingActions: [createTrailingAction()] });
		const container = screen.getByRole("button", { name: ROW_NAME });
		container.focus();
		await user.keyboard("{Enter}");
		expect(screen.getByRole("menu")).toBeInTheDocument();
		fireEvent.keyDown(container, { key: "Escape" });
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		expect(container).toHaveAttribute("aria-expanded", "false");
	});

	it("toggles the keyboard menu closed when Enter is pressed a second time", async () => {
		const user = userEvent.setup();
		renderRow({ leadingActions: [createLeadingAction()] });
		const container = screen.getByRole("button", { name: ROW_NAME });
		container.focus();
		await user.keyboard("{Enter}");
		await user.keyboard("{Enter}");
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("does not open the menu when Enter is pressed on an action button instead of the container", async () => {
		const user = userEvent.setup();
		renderRow({ leadingActions: [createLeadingAction()] });
		await user.type(screen.getByRole("button", { name: "Edit" }), "{Enter}");
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("closes the row on outside mousedown after opening", () => {
		renderRow({ leadingActions: [createLeadingAction()], swipeThreshold: 40 });
		const content = screen.getByTestId("swipeable-row-content");
		fireSwipe(content, 100, 141, 0);
		fireEvent.mouseDown(document.body);
		expect(state.animateMock).toHaveBeenLastCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("does not close from outside mousedown when the row is already closed", () => {
		renderRow({ leadingActions: [createLeadingAction()] });
		fireEvent.mouseDown(document.body);
		expect(state.animateMock).not.toHaveBeenCalled();
	});
});

describe("SwipeAction callbacks", () => {
	it("invokes the trailing action callback exactly once per activation and snaps closed", () => {
		const onDelete = vi.fn();
		renderRow({ trailingActions: [createTrailingAction({ onClick: onDelete })] });
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(onDelete).toHaveBeenCalledTimes(1);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("invokes the leading action callback exactly once per activation and snaps closed", () => {
		const onEdit = vi.fn();
		renderRow({ leadingActions: [createLeadingAction({ onClick: onEdit })] });
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(onEdit).toHaveBeenCalledTimes(1);
		expect(state.animateMock).toHaveBeenCalledWith(expect.anything(), 0, expect.objectContaining({ type: "spring" }));
	});

	it("does not invoke any action callback when the closed row is clicked", () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();
		renderRow({
			leadingActions: [createLeadingAction({ onClick: onEdit })],
			trailingActions: [createTrailingAction({ onClick: onDelete })],
		});
		fireEvent.click(screen.getByTestId("swipeable-row-content"));
		expect(onEdit).not.toHaveBeenCalled();
		expect(onDelete).not.toHaveBeenCalled();
	});

	it("invokes the keyboard menu item callback exactly once and closes the menu", async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();
		renderRow({ trailingActions: [createTrailingAction({ onClick: onDelete })] });
		const container = screen.getByRole("button", { name: ROW_NAME });
		container.focus();
		await user.keyboard("{Enter}");
		await user.click(screen.getByRole("menuitem", { name: "Delete" }));
		expect(onDelete).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("lists leading then trailing actions in the keyboard menu", async () => {
		const user = userEvent.setup();
		renderRow({ leadingActions: [createLeadingAction()], trailingActions: [createTrailingAction()] });
		const container = screen.getByRole("button", { name: ROW_NAME });
		container.focus();
		await user.keyboard("{Enter}");
		const menuItems = screen.getAllByRole("menuitem");
		expect(menuItems).toHaveLength(2);
		expect(menuItems[0]).toHaveTextContent("Edit");
		expect(menuItems[1]).toHaveTextContent("Delete");
	});

	it("invokes each action callback once when several actions are activated in sequence", () => {
		const onDelete = vi.fn();
		const onArchive = vi.fn();
		renderRow({
			trailingActions: [
				createTrailingAction({ onClick: onDelete }),
				createTrailingAction({ id: "archive", label: "Archive", onClick: onArchive }),
			],
		});
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		fireEvent.click(screen.getByRole("button", { name: "Archive" }));
		expect(onDelete).toHaveBeenCalledTimes(1);
		expect(onArchive).toHaveBeenCalledTimes(1);
	});
});

describe("SwipeableRow invalid inputs", () => {
	it("renders no action buttons when both action arrays are empty", () => {
		renderRow({ leadingActions: [], trailingActions: [] });
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.getByTestId("swipeable-row-content")).toHaveAttribute("data-drag", "false");
	});

	it("gives an empty label action an empty accessible name without crashing", () => {
		renderRow({ trailingActions: [createTrailingAction({ label: "" })] });
		const button = screen.getByRole("button", { name: "" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("aria-label", "");
	});

	it("renders the action button fallback when the handler is undefined and reports a TypeError on click", () => {
		const malformed = { id: "bad", label: "Bad", onClick: undefined } as unknown as SwipeAction;
		render(
			<SwipeableRow trailingActions={[malformed]}>
				<div>Row content</div>
			</SwipeableRow>,
		);
		const button = screen.getByRole("button", { name: "Bad" });
		expect(button).toBeInTheDocument();
		const errors = captureRowErrors(() => fireEvent.click(button));
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0]).toBeInstanceOf(TypeError);
	});

	it("renders the action button fallback when the handler is null and reports a TypeError on click", () => {
		const malformed = { id: "bad", label: "Bad", onClick: null } as unknown as SwipeAction;
		render(
			<SwipeableRow trailingActions={[malformed]}>
				<div>Row content</div>
			</SwipeableRow>,
		);
		const button = screen.getByRole("button", { name: "Bad" });
		expect(button).toBeInTheDocument();
		const errors = captureRowErrors(() => fireEvent.click(button));
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0]).toBeInstanceOf(TypeError);
	});

	it("renders zero width action buttons when actionWidth is zero", () => {
		renderRow({ leadingActions: [createLeadingAction()], actionWidth: 0 });
		expect(screen.getByRole("button", { name: "Edit" })).toHaveStyle({ width: "0px" });
		expect(state.animateMock).not.toHaveBeenCalled();
	});

	it("renders empty label menu items without crashing", async () => {
		const user = userEvent.setup();
		renderRow({ trailingActions: [createTrailingAction({ label: "" })] });
		const container = screen.getByRole("button", { name: ROW_NAME });
		container.focus();
		await user.keyboard("{Enter}");
		const menuItems = screen.getAllByRole("menuitem");
		expect(menuItems).toHaveLength(1);
		expect(menuItems[0]).toHaveTextContent("");
	});
});
