<script lang="ts">
	let { updateMobileButtonsDown } = $props();
	import { BUTTONS } from './buttons';

	let buttonsDown = $state(0);
	let prevButtonsDown = $state(0);
	const ontouchstart = (e: TouchEvent) => {
		try {
			e.preventDefault();
		} catch {} // throws error on Chromium devtools, works on real mobile
		const buttonBit = e.target.getAttribute('btn');
		buttonsDown |= buttonBit;
		updateMobileButtonsDown(buttonsDown);
	}
	const ontouchend = (e: TouchEvent) => {
		try {
			e.preventDefault();
		} catch {}
		const buttonBit = e.target.getAttribute('btn');
		buttonsDown &= (~buttonBit & 0xffff);
		updateMobileButtonsDown(buttonsDown);
	}
	let isDpadDown: boolean = $state(false);
	let dpadX: number, dpadY: number, dpadWidth: number, dpadHeight: number;
	const onDpadTouchStart = (e: TouchEvent) => {
		({ x: dpadX, y: dpadY, width: dpadWidth, height: dpadHeight } = e.target.getBoundingClientRect());
		updateDpadTouch(e);
	}
	const updateDpadTouch = (e: TouchEvent) => {
		isDpadDown = true;
		buttonsDown &= 0xf0ff;
		let { clientX: touchX, clientY: touchY } = e.targetTouches[0];
		touchX -= dpadX + dpadWidth/2;
		touchY -= dpadY + dpadHeight/2;
		touchY *= -1; // atan2 axis
		if (Math.hypot(touchX, touchY) > dpadWidth/6) { // deadzone
			const deg = (Math.atan2(touchY, touchX)*180) / Math.PI;
			buttonsDown |= (deg > 45/2 && deg < (180 - 45/2)) ? BUTTONS.U : 0;
			buttonsDown |= (deg < -45/2 && deg > (-180 + 45/2)) ? BUTTONS.D : 0;
			buttonsDown |= ((deg > (90 + 45/2)) || (deg < (-90 - 45/2))) ? BUTTONS.L : 0;
			buttonsDown |= ((deg < (90 - 45/2)) && (deg > (-90 + 45/2))) ? BUTTONS.R : 0;
		}
		buttonsDown !== prevButtonsDown && updateMobileButtonsDown(buttonsDown);
		prevButtonsDown = buttonsDown;
	}
	const onDpadTouchEnd = (e: TouchEvent) => {
		isDpadDown = false;
		buttonsDown &= 0xf0ff;
		updateMobileButtonsDown(buttonsDown);
		prevButtonsDown = buttonsDown;
	}
</script>

<div id="ctrl">
	<div id="ctrl_lb" btn={BUTTONS.LB} class={['capsuleBtn', (buttonsDown & BUTTONS.LB) && 'btnPressed']} {ontouchstart} {ontouchend}>L</div>
	<div id="ctrl_rb" btn={BUTTONS.RB} class={['capsuleBtn', (buttonsDown & BUTTONS.RB) && 'btnPressed']} {ontouchstart} {ontouchend}>R</div>
	<div id="ctrl_dpad" class={isDpadDown ? 'btnPressed' : ''}>
		<div id="ctrl_left"></div>
		<div id="ctrl_right"></div>
		<div id="ctrl_up"></div>
		<div id="ctrl_down"></div>
		<div id="ctrl_dpad_touchsurface" ontouchstart={onDpadTouchStart} ontouchmove={updateDpadTouch} ontouchend={onDpadTouchEnd}></div>
	</div>
	<div id="ctrl_select" btn={BUTTONS.SELECT} class={['capsuleBtn', (buttonsDown & BUTTONS.SELECT) && 'btnPressed']} {ontouchstart} {ontouchend}>Select</div>
	<div id="ctrl_start" btn={BUTTONS.START} class={['capsuleBtn', (buttonsDown & BUTTONS.START) && 'btnPressed']} {ontouchstart} {ontouchend}>Start</div>
	<div id="ctrl_a" btn={BUTTONS.A} class={['roundBtn', (buttonsDown & BUTTONS.A) && 'btnPressed']} {ontouchstart} {ontouchend}>A</div>
	<div id="ctrl_b" btn={BUTTONS.B} class={['roundBtn', (buttonsDown & BUTTONS.B) && 'btnPressed']} {ontouchstart} {ontouchend}>B</div>
	<div id="ctrl_x" btn={BUTTONS.X} class={['roundBtn', (buttonsDown & BUTTONS.X) && 'btnPressed']} {ontouchstart} {ontouchend}>X</div>
	<div id="ctrl_y" btn={BUTTONS.Y} class={['roundBtn', (buttonsDown & BUTTONS.Y) && 'btnPressed']} {ontouchstart} {ontouchend}>Y</div>
</div>

<style>
#ctrl {
	z-index: var(--z-controls);
	position: fixed;
	bottom: 0px;
	width: 100%;
	touch-action: none;
	opacity: 0.4;
}

#ctrl_lb {
	position: absolute;
	width: 100px;
	left: 16px;
	bottom: 270px;
}

#ctrl_rb {
	position: absolute;
	width: 100px;
	right: 16px;
	bottom: 270px;
}

#ctrl_dpad {
	position: absolute;
	bottom: 64px;
	left: 0px;
	width: 184px;
	height: 184px;
	&:before {
		content: "";
		display: block;
		width: 48px;
		height: 48px;
		background: transparent;
		position: absolute;
		left: 68px;
		top: 68px;
	}
}

#ctrl_left {
	position: absolute;
	left: 20px;
	top: 68px;
	width: 48px;
	height: 48px;
	background: transparent;
	border-top: 1px solid white;
	border-left: 1px solid white;
	border-bottom: 1px solid white;
	border-top-left-radius: 4px;
	border-bottom-left-radius: 4px;
}

#ctrl_right {
	position: absolute;
	left: 117px;
	top: 68px;
	width: 48px;
	height: 48px;
	background: transparent;
	border-top: 1px solid white;
	border-right: 1px solid white;
	border-bottom: 1px solid white;
	border-top-right-radius: 4px;
	border-bottom-right-radius: 4px;
}

#ctrl_up {
	position: absolute;
	left: 68px;
	top: 20px;
	width: 48px;
	height: 48px;
	background: transparent;
	border-top: 1px solid white;
	border-left: 1px solid white;
	border-right: 1px solid white;
	border-top-left-radius: 4px;
	border-top-right-radius: 4px;
}

#ctrl_down {
	position: absolute;
	left: 68px;
	top: 118px;
	width: 48px;
	height: 48px;
	background: transparent;
	border-bottom: 1px solid white;
	border-left: 1px solid white;
	border-right: 1px solid white;
	border-bottom-left-radius: 4px;
	border-bottom-right-radius: 4px;
}

#ctrl_dpad_touchsurface {
	background-color: transparent;
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
}

#ctrl_a {
	position: absolute;
	bottom: 124px;
	right: 4px;
}

#ctrl_b {
	position: absolute;
	bottom: 64px;
	right: 63px;
}

#ctrl_x {
	position: absolute;
	bottom: 184px;
	right: 63px;
}

#ctrl_y {
	position: absolute;
	bottom: 124px;
	right: 120px;
}

.roundBtn {
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 20px;
	color: white;
	line-height: 64px;
	width: 64px;
	height: 64px;
	border: 1px solid white;
	border-radius: 64px;
	background: transparent;
	box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.2);
}

.capsuleBtn {
	font-weight: bold;
	font-size: 10px;
	color: white;
	display: flex;
	justify-content: center;
	align-items: center;
	line-height: 40px;
	text-transform: uppercase;
	width: 64px;
	height: 32px;
	border: 1px solid white;
	border-radius: 40px;
	background: transparent;
	box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.2);
}

#ctrl_start {
	position: absolute;
	bottom: 20px;
	right: 110px;
}

#ctrl_select {
	position: absolute;
	bottom: 20px;
	left: 110px;
}

.btnPressed {
	opacity: 0.4;
}


@media only screen and (max-device-width: 320px) and (orientation: portrait) {
	#ctrl_dpad {
		left: -5px;
		bottom: -5px;
	}

	#ctrl_a {
		right: 5px;
		bottom: 95px;
	}

	#ctrl_b {
		right: 80px;
	}

	#ctrl_start {
		right: 5px;
	}

	#ctrl_select {
		right: 80px;
	}
}

@media only screen and (max-width: 500px) and (max-height: 400px) {
	#ctrl {
		display: none;
	}
}
</style>
