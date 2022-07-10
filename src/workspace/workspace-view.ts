import { Dom } from '../core/dom';
import { readMousePosition, readTouchPosition } from '../core/event-readers';
import { Vector } from '../core/vector';
import { Sequence } from '../definition';
import { StepsConfiguration } from '../designer-configuration';
import { StartStopComponent } from './start-stop/start-stop-component';

const GRID_SIZE = 48;

let lastGridPatternId = 0;

export class WorkspaceView {
	public static create(parent: HTMLElement, configuration: StepsConfiguration): WorkspaceView {
		const defs = Dom.svg('defs');
		const gridPatternId = 'sqd-grid-pattern-' + lastGridPatternId++;
		const gridPattern = Dom.svg('pattern', {
			id: gridPatternId,
			patternUnits: 'userSpaceOnUse'
		});
		const gridPatternPath = Dom.svg('path', {
			class: 'sqd-grid-path',
			fill: 'none'
		});

		defs.appendChild(gridPattern);
		gridPattern.appendChild(gridPatternPath);

		const foreground = Dom.svg('g');

		const workspace = Dom.element('div', {
			class: 'sqd-workspace'
		});
		const canvas = Dom.svg('svg', {
			class: 'sqd-workspace-canvas'
		});
		canvas.appendChild(defs);
		canvas.appendChild(
			Dom.svg('rect', {
				width: '100%',
				height: '100%',
				fill: `url(#${gridPatternId})`
			})
		);
		canvas.appendChild(foreground);
		workspace.appendChild(canvas);
		parent.appendChild(workspace);

		const view = new WorkspaceView(workspace, canvas, gridPattern, gridPatternPath, foreground, configuration);
		window.addEventListener('resize', view.onResizeHandler, false);
		return view;
	}

	private onResizeHandler = () => this.onResize();
	public rootComponent?: StartStopComponent;

	private constructor(
		private readonly workspace: HTMLElement,
		private readonly canvas: SVGElement,
		private readonly gridPattern: SVGPatternElement,
		private readonly gridPatternPath: SVGPathElement,
		private readonly foreground: SVGGElement,
		private readonly configuration: StepsConfiguration
	) {}

	public render(sequence: Sequence) {
		if (this.rootComponent) {
			this.rootComponent.view.destroy();
		}
		this.rootComponent = StartStopComponent.create(this.foreground, sequence, this.configuration);
		this.refreshSize();
	}

	public setPositionAndScale(position: Vector, scale: number) {
		const gridSize = GRID_SIZE * scale;
		Dom.attrs(this.gridPattern, {
			x: position.x,
			y: position.y,
			width: gridSize,
			height: gridSize
		});
		Dom.attrs(this.gridPatternPath, {
			d: `M ${gridSize} 0 L 0 0 0 ${gridSize}`
		});
		Dom.attrs(this.foreground, {
			transform: `translate(${position.x}, ${position.y}) scale(${scale})`
		});
	}

	public getClientPosition(): Vector {
		const rect = this.canvas.getBoundingClientRect();
		return new Vector(rect.x, rect.y);
	}

	public getClientSize(): Vector {
		return new Vector(this.canvas.clientWidth, this.canvas.clientHeight);
	}

	public bindMouseDown(handler: (position: Vector, target: Element, button: number) => void) {
		this.canvas.addEventListener(
			'mousedown',
			e => {
				e.preventDefault();
				handler(readMousePosition(e), e.target as Element, e.button);
			},
			false
		);
	}

	public bindTouchStart(handler: (position: Vector) => void) {
		this.canvas.addEventListener(
			'touchstart',
			e => {
				e.preventDefault();
				handler(readTouchPosition(e));
			},
			false
		);
	}

	public bindWheel(handler: (e: WheelEvent) => void) {
		this.canvas.addEventListener('wheel', handler, false);
	}

	public destroy() {
		window.removeEventListener('resize', this.onResizeHandler, false);
	}

	public refreshSize() {
		Dom.attrs(this.canvas, {
			width: this.workspace.offsetWidth,
			height: this.workspace.offsetHeight
		});
	}

	private onResize() {
		this.refreshSize();
	}
}
