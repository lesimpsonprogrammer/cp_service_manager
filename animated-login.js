(() => {
  const canvas = document.querySelector('#cpsmFlowCanvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tokens = [
    'CPSM', 'CLIENT', 'PORTFOLIO', 'SERVICE', 'MANAGER', 'FLOW', 'TASK', 'STATUS',
    'PROJECT', 'WORKFLOW', 'APPROVAL', 'DOC', 'TIME', 'BILLABLE', 'ESTIMATE', 'ACTUAL',
    '001', '010', '101', 'ID', 'QA', 'PM', 'ETA', 'SYNC', 'READY', 'OPEN', 'DONE'
  ];
  const palette = [
    { color: '#20ff76', glow: 'rgba(32, 255, 118, 0.72)' },
    { color: '#15d8ff', glow: 'rgba(21, 216, 255, 0.72)' },
    { color: '#ffb94a', glow: 'rgba(255, 185, 74, 0.62)' },
    { color: '#e9fbff', glow: 'rgba(233, 251, 255, 0.54)' },
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
    const streamCount = Math.max(8, Math.min(16, Math.round(width / 82)));
    const sidePadding = width * 0.06;
    const availableWidth = width - sidePadding * 2;
    const gap = availableWidth / Math.max(1, streamCount - 1);

    streams = Array.from({ length: streamCount }, (_, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const hue = palette[index % palette.length];
      const baseX = sidePadding + gap * index;
      const tokenSize = randomBetween(15, 24);
      const spacing = tokenSize * randomBetween(1.34, 1.68);
      const tokenRows = Math.ceil(height / spacing) + 12;

      return {
        x: baseX + randomBetween(-12, 12),
        y: randomBetween(-height, height),
        direction,
        speed: reducedMotion ? 0 : randomBetween(0.22, 0.72),
        fontSize: tokenSize,
        spacing,
        rows: tokenRows,
        alpha: randomBetween(0.38, 0.82),
        color: hue.color,
        glow: hue.glow,
        drift: randomBetween(-0.02, 0.02),
        tokens: Array.from({ length: tokenRows }, () => pick(tokens)),
        readableEvery: 4 + (index % 5),
      };
    });
  }

  function drawCompassPulse(time) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.23;
    const pulse = Math.sin(time / 1500) * 0.5 + 0.5;

    context.save();
    context.strokeStyle = `rgba(21, 216, 255, ${0.05 + pulse * 0.04})`;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(centerX, centerY, radius + pulse * 18, 0, Math.PI * 2);
    context.stroke();

    context.strokeStyle = `rgba(32, 255, 118, ${0.035 + pulse * 0.03})`;
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.7 + pulse * 10, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function drawStream(stream, time) {
    const xWave = Math.sin(time / 2200 + stream.x) * 4;
    context.font = `${stream.fontSize}px ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (let row = 0; row < stream.rows; row += 1) {
      const rawY = stream.y + row * stream.spacing * stream.direction;
      const y = ((rawY % (height + stream.spacing * 8)) + height + stream.spacing * 4) % (height + stream.spacing * 8) - stream.spacing * 4;
      const token = stream.tokens[row % stream.tokens.length];
      const isReadable = row % stream.readableEvery === 0;
      const fadeEdge = Math.min(1, Math.max(0, y / 120), Math.max(0, (height - y) / 120));
      const alpha = stream.alpha * fadeEdge * (isReadable ? 1 : 0.46);

      context.shadowColor = stream.glow;
      context.shadowBlur = isReadable ? 16 : 9;
      context.fillStyle = alpha > 0.74 ? '#ffffff' : stream.color;
      context.globalAlpha = alpha;
      context.fillText(token, stream.x + xWave + row * stream.drift, y);
    }

    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  function draw(time = 0) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(0, 0, 0, 0.16)';
    context.fillRect(0, 0, width, height);

    drawCompassPulse(time);

    streams.forEach((stream) => {
      drawStream(stream, time);
      stream.y += stream.speed * stream.direction;

      if (Math.random() < 0.006) {
        const tokenIndex = Math.floor(Math.random() * stream.tokens.length);
        stream.tokens[tokenIndex] = pick(tokens);
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
