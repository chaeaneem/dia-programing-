
let signal = [];
let glyphs = [];
let drawing = false;
let replying = false;
let replyStart = 0;

const colors = [
  [180, 230, 255],
  [130, 130, 255],
  [220, 130, 255],
  [255, 150, 220],
  [255, 255, 255]
];

function setup() {
  createCanvas(700, 460);
  pixelDensity(1);
  background(0);
}

function draw() {
  background(0);
  noStroke();

  // 관객이 그린 신호
  for (let p of signal) {
    fill(180, 225, 255, p.a);
    circle(p.x, p.y, 2);

    if (!drawing) p.a -= 3;
  }

  signal = signal.filter(p => p.a > 0);

  if (drawing) {
    signal.push({
      x: mouseX + random(-1, 1),
      y: mouseY + random(-1, 1),
      a: 255
    });
  }

  if (!replying) return;

  let elapsed = millis() - replyStart;

  // 외계인의 문양 응답
  for (let g of glyphs) {
    let progress = constrain(
      (elapsed - g.start) / g.duration,
      0, 1
    );

    if (progress <= 0) continue;

    push();
    translate(g.x, g.y);
    rotate(g.rotation + frameCount * g.spin);

    let visible = floor(g.points.length * progress);

    for (let i = 0; i < visible; i++) {
      let p = g.points[i];

      let n = noise(p.seed, frameCount * 0.012);
      let x = p.x + (n - 0.5) * 8;
      let y = p.y +
        (noise(p.seed + 50, frameCount * 0.012) - 0.5) * 8;

      let c = colors[p.c];
      let twinkle = 0.55 +
        0.45 * sin(frameCount * 0.09 + p.phase);

      // 빛 번짐
      fill(c[0], c[1], c[2], 35 * twinkle);
      circle(x, y, p.s * 4);

      // 중심 입자
      fill(c[0], c[1], c[2], 210 * twinkle);
      circle(x, y, p.s);
    }

    // 문양 주변을 떠도는 입자
    for (let p of g.orbit) {
      let a = p.angle + frameCount * p.speed;
      let r = p.radius +
        sin(frameCount * 0.035 + p.phase) * 5;

      let x = cos(a) * r;
      let y = sin(a) * r;
      let c = colors[p.c];

      fill(c[0], c[1], c[2], 100);
      circle(x, y, p.size);
    }

    pop();
  }

  // 마지막 문양이 끝나면 응답 종료
  let last = glyphs[glyphs.length - 1];

  if (last &&
      elapsed > last.start + last.duration + 2500) {
    replying = false;
  }
}


// 입자 추가
function addPoint(points, x, y, size = random(0.7, 1.8)) {
  points.push({
    x: x,
    y: y,
    s: size,
    seed: random(1000),
    phase: random(TWO_PI),
    c: floor(random(colors.length))
  });
}


// 원형 고리형 문양
function makeRing(points, r, wobble, count) {
  let phase = random(TWO_PI);
  let waves = floor(random(2, 7));

  for (let i = 0; i < count; i++) {
    let a = TWO_PI * i / count;
    let radius = r
      + sin(a * waves + phase) * wobble
      + random(-2, 2);

    addPoint(
      points,
      cos(a) * radius,
      sin(a) * radius
    );
  }
}


// 방사형 문양
function makeRadial(points, radius) {
  let arms = floor(random(5, 12));

  for (let b = 0; b < arms; b++) {
    let angle = TWO_PI * b / arms + random(-0.2, 0.2);
    let length = random(radius * 0.55, radius);
    let bend = random(-0.7, 0.7);
    let steps = floor(random(45, 75));

    for (let i = 0; i < steps; i++) {
      let t = i / (steps - 1);
      let a = angle + bend * t + 0.1 * sin(t * 12 + b);
      let r = length * t;

      addPoint(
        points,
        cos(a) * r,
        sin(a) * r
      );
    }
  }
}


// 나선형 문양
function makeSpiral(points, radius) {
  let arms = floor(random(2, 5));

  for (let b = 0; b < arms; b++) {
    let direction = random() < 0.5 ? 1 : -1;
    let offset = random(TWO_PI);
    let turns = random(1.5, 3.5);
    let steps = 180;

    for (let i = 0; i < steps; i++) {
      let t = i / (steps - 1);
      let a = offset + direction * t * TWO_PI * turns;
      let r = radius * t;

      addPoint(
        points,
        cos(a) * r,
        sin(a) * r,
        random(0.7, 1.6)
      );
    }
  }
}


// 가지형 문양
function makeBranches(points, radius) {
  let branches = floor(random(3, 6));

  for (let b = 0; b < branches; b++) {
    let angle = TWO_PI * b / branches + random(-0.3, 0.3);
    let length = random(radius * 0.6, radius);
    let x = 0;
    let y = 0;
    let currentAngle = angle;

    for (let i = 0; i < 90; i++) {
      let t = i / 89;

      currentAngle += random(-0.09, 0.09);
      x += cos(currentAngle) * length / 90;
      y += sin(currentAngle) * length / 90;

      addPoint(points, x, y);

      // 가지에서 다시 뻗어나오는 작은 선
      if (i % 18 === 0 && i > 0 && random() < 0.75) {
        let branchAngle = currentAngle + random(-1.1, 1.1);
        let bx = x;
        let by = y;
        let branchLength = random(10, 30);

        for (let j = 0; j < 22; j++) {
          let bt = j / 21;
          let ba = branchAngle + sin(bt * PI) * 0.3;

          bx += cos(ba) * branchLength / 22;
          by += sin(ba) * branchLength / 22;

          addPoint(points, bx, by, random(0.6, 1.5));
        }
      }
    }
  }
}


// 문양 안쪽 구조
function makeCore(points, radius, type) {
  if (type === 0 || type === 2) {
    makeRing(points, radius * 0.35, radius * 0.06, 100);

  } else if (type === 1) {
    for (let i = 0; i < 70; i++) {
      let a = random(TWO_PI);
      let r = random(radius * 0.08, radius * 0.35);

      addPoint(
        points,
        cos(a) * r,
        sin(a) * r
      );
    }

  } else {
    let turns = 2.5;

    for (let i = 0; i < 120; i++) {
      let t = i / 119;
      let a = t * TWO_PI * turns;
      let r = radius * 0.35 * t;

      addPoint(
        points,
        cos(a) * r,
        sin(a) * r
      );
    }
  }
}


// 무작위 외계 문양 생성
function createGlyph(x, y, start) {
  let points = [];
  let radius = random(75, 105);

  // 0: 고리형, 1: 방사형, 2: 나선형, 3: 가지형
  let type = floor(random(4));

  if (type === 0) {
    makeRing(points, radius * 0.72, radius * 0.13, 240);
    makeRing(points, radius * 0.43, radius * 0.08, 160);

    let arms = floor(random(4, 8));

    for (let i = 0; i < arms; i++) {
      let a = TWO_PI * i / arms + random(-0.2, 0.2);

      for (let j = 0; j < 30; j++) {
        let r = radius * 0.65 + j * 0.8;

        addPoint(
          points,
          cos(a) * r,
          sin(a) * r
        );
      }
    }

  } else if (type === 1) {
    makeRadial(points, radius);
    makeRing(points, radius * 0.32, 5, 100);

  } else if (type === 2) {
    makeSpiral(points, radius);
    makeRing(points, radius * 0.7, 5, 120);

  } else {
    makeBranches(points, radius);
    makeRing(points, radius * 0.25, 4, 80);
  }

  makeCore(points, radius, type);

  // 주변 입자
  let orbit = [];

  for (let i = 0; i < 35; i++) {
    orbit.push({
      angle: random(TWO_PI),
      radius: random(radius * 1.05, radius * 1.4),
      speed: random(-0.012, 0.012),
      phase: random(TWO_PI),
      size: random(1, 2.5),
      c: floor(random(colors.length))
    });
  }

  return {
    x: x,
    y: y,
    points: points,
    orbit: orbit,
    radius: radius,
    start: start,
    duration: 4200,
    rotation: random(TWO_PI),
    spin: random(-0.003, 0.003)
  };
}


// 마우스로 신호 보내기
function mousePressed() {
  if (mouseX < 0 || mouseX > width ||
      mouseY < 0 || mouseY > height) return;

  drawing = true;
  replying = false;
  signal = [];
  glyphs = [];

  signal.push({
    x: mouseX,
    y: mouseY,
    a: 255
  });
}

function mouseDragged() {
  if (!drawing) return;

  signal.push({
    x: mouseX + random(-1, 1),
    y: mouseY + random(-1, 1),
    a: 255
  });
}


// 입력이 끝나면 외계인이 순서대로 답장
function mouseReleased() {
  if (!drawing) return;
  drawing = false;

  if (signal.length < 5) return;

  let count = constrain(
    floor(map(signal.length, 5, 180, 1, 4)),
    1, 4
  );

  let spacing = width / (count + 1);

  for (let i = 0; i < count; i++) {
    let start = i === 0
      ? 0
      : glyphs[i - 1].start +
        glyphs[i - 1].duration + 300;

    glyphs.push(createGlyph(
      spacing * (i + 1),
      height / 2 + random(-15, 15),
      start
    ));
  }

  replyStart = millis() + 1800;
  replying = true;
}
