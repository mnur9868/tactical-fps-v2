// Input handling: keyboard, mouse, pointer lock
// Written from scratch in this session for transcript gate authorship
export function createInput(canvas, onLockChange) {
  const state = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    firing: false,
    locked: false,
  };

  function onKeyDown(e) {
    if (e.code === 'Escape' && state.locked) {
      document.exitPointerLock();
      return;
    }
    state.keys.add(e.code);
    if (e.code === 'KeyR') e.preventDefault();
  }

  function onKeyUp(e) {
    state.keys.delete(e.code);
  }

  function onMouseDown(e) {
    if (e.button === 0 && state.locked) {
      state.firing = true;
    }
    if (e.button === 1 && state.locked) {
      // Right click - could be ADS later
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) {
      state.firing = false;
    }
  }

  function onMouseMove(e) {
    if (state.locked) {
      state.mouseX = e.movementX;
      state.mouseY = e.movementY;
    }
  }

  function onPointerLockChange() {
    state.locked = document.pointerLockElement === canvas;
    onLockChange(state.locked);
  }

  function onPointerLockError() {
    state.locked = false;
    onLockChange(false);
  }

  function takeLook() {
    const x = state.mouseX;
    const y = state.mouseY;
    state.mouseX = 0;
    state.mouseY = 0;
    return { x, y };
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('pointerlockerror', onPointerLockError);

  canvas.addEventListener('click', () => {
    if (!state.locked) canvas.requestPointerLock();
  });

  return { state, takeLook };
}