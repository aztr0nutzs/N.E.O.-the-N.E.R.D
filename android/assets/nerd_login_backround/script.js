import GLea from 'https://esm.sh/glea';
const $ = document.querySelector.bind(document);
const frag = $('[type="x-shader/fragment"]').textContent;
const vert = $('[type="x-shader/vertex"]').textContent;



const glea = new GLea({
  shaders: [
    GLea.fragmentShader(frag),
    GLea.vertexShader(vert)
  ],
  buffers: {
    'position': GLea.buffer(2, [1, 1,  -1, 1,  1,-1,  -1,-1])
  }
}).create();

window.addEventListener('resize', () => {
  glea.resize();
});

function loop(time) {
  const { gl } = glea;
  glea.clear();
  glea.uni('width', glea.width);
  glea.uni('height', glea.height);
  glea.uni('time', time * .005);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(loop);
}

loop(0);