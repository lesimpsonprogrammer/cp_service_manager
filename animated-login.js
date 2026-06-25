(() => {
  const canvas = document.querySelector('#cpsmFlowCanvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tokens = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'P', 'Q', 'S', 'T', 'X', 'Z',
    '#', '$', '%', '&', '*', '+', '-', '/', '<', '>', '?', '@', '[', ']', '{', '}', '|'
  ];
  const palette = [
    { color: '#22ff72', glow: 'rgba(34, 255, 114, 0.76)' },
    { color: '#1bdcff', glow: 'rgba(27, 220, 255, 0.72)' },
    { color: '#1f6feb', glow: 'rgba(31, 111, 235, 0.66)' },
    { color: '#ffb84d', glow: 'rgba(255, 184, 77, 0.58)' },
    { color: '#eafff5', glow: 'rgba(234, 255, 245, 0.48)' },
  ];

  let width = 0;
  let height = 0;
  let streams = [];
  let animationFrame = null;

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(320, Math.floor(bounds.width));
    height = Math.max(320, Math.floor(bounds.height));
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createStreams();
  }

  function createStreams() {
    const streamCount = Math.max(10, Math.min(18, Math.round(width / 72)));
    const sidePadding = width * 0.055;
    const availableWidth = width - sidePadding * 2;
    const gap = availableWidth / Math.max(1, streamCount - 1);

    streams = Array.from({ length: streamCount }, (_, index) => {
      const direction = index % 3 === 0 ? -1 : 1;
      const hue = palette[index % palette.length];
      const fontSize = randomBetween(17, 26);
      const spacing = fontSize * randomBetween(1.1, 1.42);
      const rows = Math.ceil(height / spacing) + 18;

      return {
        x: sidePadding + gap * index + randomBetween(-8, 8),
        y: randomBetween(-height, height),
        direction,
        speed: reducedMotion ? 0 : randomBetween(0.28, 0.82),
        fontSize,
        spacing,
        rows,
        alpha: randomBetween(0.4, 0.86),
        color: hue.color,
        glow: hue.glow,
        tokens: Array.from({ length: rows }, () => pick(tokens)),
        leadIndex: Math.floor(randomBetween(2, rows - 2)),
        flickerRate: randomBetween(0.004, 0.012),
      };
    });
  }

  function drawStream(stream, time) {
    context.font = `${stream.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (let row = 0; row < stream.rows; row += 1) {
      const rawY = stream.y + row * stream.spacing * stream.direction;
      const y = ((rawY % (height + stream.spacing * 10)) + height + stream.spacing * 5) % (height + stream.spacing * 10) - stream.spacing * 5;
      const fadeEdge = Math.min(1, Math.max(0, y / 110), Math.max(0, (height - y) / 110));
      const pulse = Math.sin(time / 380 + row * 0.7) * 0.12 + 0.88;
      const isLead = row === stream.leadIndex || row === stream.leadIndex + 1;
      const alpha = stream.alpha * fadeEdge * pulse * (isLead ? 1 : 0.58);

      context.globalAlpha = alpha;
      context.shadowColor = stream.glow;
      context.shadowBlur = isLead ? 18 : 11;
      context.fillStyle = isLead ? '#ffffff' : stream.color;
      context.fillText(stream.tokens[row % stream.tokens.length], stream.x, y);
    }

    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  function draw(time = 0) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#000000';
    context.fillRect(0, 0, width, height);

    streams.forEach((stream) => {
      drawStream(stream, time);
      stream.y += stream.speed * stream.direction;

      if (Math.random() < stream.flickerRate) {
        const tokenIndex = Math.floor(Math.random() * stream.tokens.length);
        stream.tokens[tokenIndex] = pick(tokens);
      }

      if (Math.random() < 0.004) {
        stream.leadIndex = Math.floor(randomBetween(2, stream.rows - 2));
      }
    });

    if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(draw);
    }
  }

  function start() {
    resizeCanvas();
    draw();
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('beforeunload', () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }
  });

  start();
})();
