/*
 * Ethiopian Unity Emblem – standalone 3D hero ornament (Three.js r128).
 * An independent decorative piece, not an official national emblem.
 * Falls back to the static SVG already in the markup if WebGL is unavailable.
 */
(function () {
  "use strict";

  var host = document.querySelector(".hero-unity-emblem");
  var stage = host && host.querySelector(".unity-emblem-stage");
  if (!host || !stage || typeof THREE === "undefined") return;

  // Simplified outline of Ethiopia, normalised to a 2-unit-wide box.
  var OUTLINE = [[-0.856,0.042],[-0.852,0.073],[-0.822,0.146],[-0.828,0.192],[-0.809,0.221],[-0.789,0.235],[-0.765,0.216],[-0.765,0.208],[-0.753,0.214],[-0.737,0.238],[-0.743,0.245],[-0.734,0.276],[-0.739,0.285],[-0.722,0.325],[-0.722,0.362],[-0.689,0.389],[-0.64,0.475],[-0.583,0.481],[-0.58,0.526],[-0.567,0.57],[-0.546,0.602],[-0.528,0.692],[-0.499,0.701],[-0.457,0.694],[-0.449,0.713],[-0.426,0.718],[-0.391,0.671],[-0.346,0.775],[-0.331,0.754],[-0.301,0.748],[-0.275,0.713],[-0.216,0.723],[-0.197,0.744],[-0.181,0.738],[-0.17,0.716],[-0.129,0.733],[-0.079,0.714],[-0.051,0.719],[0.047,0.671],[0.094,0.604],[0.164,0.555],[0.195,0.505],[0.227,0.485],[0.253,0.449],[0.194,0.363],[0.175,0.346],[0.169,0.324],[0.17,0.251],[0.194,0.242],[0.284,0.263],[0.3,0.26],[0.305,0.251],[0.325,0.251],[0.289,0.201],[0.314,0.144],[0.333,0.128],[0.345,0.106],[0.361,0.1],[0.369,0.069],[0.385,0.054],[0.392,0.037],[0.419,0.026],[0.467,-0.018],[0.867,-0.155],[1.0,-0.155],[0.792,-0.357],[0.595,-0.571],[0.465,-0.566],[0.406,-0.581],[0.352,-0.607],[0.33,-0.625],[0.313,-0.654],[0.216,-0.669],[0.18,-0.701],[0.162,-0.695],[0.091,-0.702],[0.037,-0.656],[-0.085,-0.712],[-0.096,-0.737],[-0.131,-0.775],[-0.156,-0.763],[-0.212,-0.76],[-0.264,-0.742],[-0.272,-0.748],[-0.318,-0.747],[-0.463,-0.644],[-0.486,-0.636],[-0.593,-0.635],[-0.606,-0.626],[-0.609,-0.611],[-0.631,-0.579],[-0.624,-0.517],[-0.669,-0.501],[-0.686,-0.512],[-0.693,-0.509],[-0.697,-0.49],[-0.719,-0.475],[-0.735,-0.443],[-0.737,-0.416],[-0.771,-0.332],[-0.795,-0.323],[-0.798,-0.304],[-0.828,-0.292],[-0.841,-0.267],[-0.861,-0.255],[-0.864,-0.234],[-0.903,-0.201],[-0.937,-0.188],[-0.952,-0.192],[-0.991,-0.181],[-1.0,-0.165],[-0.974,-0.135],[-0.977,-0.105],[-0.967,-0.093],[-0.916,-0.092],[-0.9,-0.105],[-0.872,-0.096],[-0.853,-0.079]];
  var MAP_Y_MIN = -0.78, MAP_Y_MAX = 0.78;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) { return; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NoToneMapping;
  stage.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.2, 9.6);
  camera.lookAt(0, 0, 0);

  /* ---------- procedural studio / sunset environment for metal reflections ---------- */
  function buildEnvironment() {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    var g = c.getContext("2d");
    var grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#6f8fb8");
    grad.addColorStop(0.42, "#ffe2a8");
    grad.addColorStop(0.5, "#fff3d6");
    grad.addColorStop(0.58, "#7a5a33");
    grad.addColorStop(1, "#1f2a22");
    g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
    g.fillStyle = "rgba(255,255,255,0.95)";          // soft boxes
    g.fillRect(70, 60, 60, 38); g.fillRect(330, 50, 80, 30);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    var envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })
    ));
    var pm = new THREE.PMREMGenerator(renderer);
    var rt = pm.fromScene(envScene, 0.02);
    pm.dispose(); tex.dispose();
    return rt.texture;
  }
  scene.environment = buildEnvironment();

  var key = new THREE.DirectionalLight(0xfff0cf, 1.1);
  key.position.set(3, 4, 5); scene.add(key);
  var rim = new THREE.DirectionalLight(0xffc77a, 0.9);
  rim.position.set(-4, 1.5, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  /* ---------- textures for the tricolour map face ---------- */
  function noiseCanvas(w, h, base, spread) {
    // low-res noise, smoothly upscaled -> soft, stone-like grain rather than speckle
    var sw = Math.round(w / 8), sh = Math.round(h / 8);
    var small = document.createElement("canvas"); small.width = sw; small.height = sh;
    var g = small.getContext("2d"), img = g.createImageData(sw, sh);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = base + (Math.random() - 0.5) * spread;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var cg = c.getContext("2d"); cg.imageSmoothingEnabled = true; cg.imageSmoothingQuality = "high";
    cg.drawImage(small, 0, 0, w, h); return c;
  }
  function bandTexture() {
    var w = 512, h = 400, c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    // canvas y=0 is top of texture (map north) -> green, then yellow, then red
    function band(y0, y1, light, mid, dark) {
      var gr = g.createLinearGradient(0, y0, w, y1);
      gr.addColorStop(0, light); gr.addColorStop(0.5, mid); gr.addColorStop(1, dark);
      g.fillStyle = gr; g.fillRect(0, y0, w, y1 - y0 + 1);
    }
    band(0, h / 3, "#2fae5a", "#0f8a3d", "#0a6a31");
    band(h / 3, 2 * h / 3, "#ffe36b", "#f5b920", "#d9960f");
    band(2 * h / 3, h, "#f0544a", "#cf2a2f", "#9c1c24");
    var n = noiseCanvas(w, h, 128, 70);               // grain
    g.globalCompositeOperation = "overlay"; g.globalAlpha = 0.22;
    g.drawImage(n, 0, 0);
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }
  var faceMap = bandTexture();
  var faceBump = new THREE.CanvasTexture(noiseCanvas(256, 200, 128, 255));
  [faceMap, faceBump].forEach(function (t) {
    // ExtrudeGeometry UVs are raw x,y: remap x[-1,1] and y[min,max] to 0..1
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.repeat.set(1 / 2, 1 / (MAP_Y_MAX - MAP_Y_MIN));
    t.offset.set(0.5, -MAP_Y_MIN / (MAP_Y_MAX - MAP_Y_MIN));
  });
  faceBump.wrapS = faceBump.wrapT = THREE.RepeatWrapping;
  faceBump.repeat.set(3, 3 * 1.3); faceBump.offset.set(0, 0);

  /* ---------- the map ---------- */
  var shape = new THREE.Shape(OUTLINE.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
  var mapGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 3, curveSegments: 1
  });
  mapGeo.translate(0, 0, -0.07);
  var faceMat = new THREE.MeshStandardMaterial({
    map: faceMap, bumpMap: faceBump, bumpScale: 0.6, roughness: 0.6, metalness: 0.1, envMapIntensity: 0.45
  });
  var goldMat = new THREE.MeshStandardMaterial({
    color: 0xd9a52e, metalness: 1, roughness: 0.3, envMapIntensity: 1.1
  });
  var mapMesh = new THREE.Mesh(mapGeo, [faceMat, goldMat]);
  // Same silhouette, slightly larger & thinner behind: a gold rim for the bezel look.
  var emblem = new THREE.Group();
  mapMesh.scale.set(1.3, 1.3, 1.3);
  emblem.add(mapMesh);

  /* ---------- three ribbons (wide flat bands) ---------- */
  function makeBand(radius, width, thickness, color, clearcoat) {
    var s = new THREE.Shape();
    s.absarc(0, 0, radius, 0, Math.PI * 2, false);
    var hole = new THREE.Path();
    hole.absarc(0, 0, radius - thickness, 0, Math.PI * 2, true);
    s.holes.push(hole);
    var geo = new THREE.ExtrudeGeometry(s, {
      depth: width, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 96
    });
    geo.translate(0, 0, -width / 2);
    var mat = new THREE.MeshPhysicalMaterial({
      color: color, metalness: 0.4, roughness: 0.28, clearcoat: clearcoat, clearcoatRoughness: 0.1, envMapIntensity: 0.7
    });
    return new THREE.Mesh(geo, mat);
  }
  var bands = [
    { mesh: makeBand(1.95, 0.34, 0.05, 0x0a7a32, 1), tilt: [1.15, 0.5, 0.2], spin: 0.11 },
    { mesh: makeBand(1.78, 0.30, 0.05, 0xf2b200, 1), tilt: [0.35, -0.35, 1.05], spin: -0.085 },
    { mesh: makeBand(2.1, 0.30, 0.05, 0xc4161c, 1), tilt: [1.35, -0.2, -0.45], spin: 0.065 }
  ];
  var orbits = [];
  bands.forEach(function (b, i) {
    var pivot = new THREE.Group();            // pivot spins about the vertical axis
    b.mesh.rotation.set(b.tilt[0], b.tilt[1], b.tilt[2]);
    pivot.rotation.y = i * 2.1;
    pivot.add(b.mesh); emblem.add(pivot);
    orbits.push({ pivot: pivot, mesh: b.mesh, spin: b.spin, base: b.tilt.slice(), phase: i * 1.7 });
  });

  // faint glowing orbit trail
  var trailMat = new THREE.MeshBasicMaterial({
    color: 0xffd27a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false
  });
  var trail = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.008, 6, 160), trailMat);
  trail.rotation.set(1.25, 0.3, -0.3);
  emblem.add(trail);

  emblem.rotation.x = 0.1;
  scene.add(emblem);

  /* ---------- sizing, loop, lifecycle ---------- */
  function resize() {
    var w = stage.clientWidth || 200, h = stage.clientHeight || w;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  else window.addEventListener("resize", resize);

  var running = false, visible = true, raf = 0, last = 0, t = 0;
  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    emblem.rotation.y += dt * 0.32;                         // slow turn about the vertical axis
    emblem.position.y = Math.sin(t * 0.9) * 0.07;           // gentle float
    for (var i = 0; i < orbits.length; i++) {               // rings drift and weave around the map
      var o = orbits[i];
      o.pivot.rotation.y += dt * o.spin * 2.2;
      o.mesh.rotation.x = o.base[0] + Math.sin(t * 0.35 + o.phase) * 0.18;
      o.mesh.rotation.z = o.base[2] + Math.cos(t * 0.3 + o.phase) * 0.14;
    }
    key.position.x = 3 + Math.sin(t * 0.6) * 1.2;           // subtle moving highlight
    trailMat.opacity = 0.42 + Math.sin(t * 1.4) * 0.14;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function update() {
    var shouldRun = visible && !document.hidden && !reduceMotion.matches;
    if (shouldRun && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!shouldRun) {
      running = false; if (raf) cancelAnimationFrame(raf);
      renderer.render(scene, camera);                       // keep a still frame (reduced motion)
    }
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; update(); }).observe(host);
  }
  document.addEventListener("visibilitychange", update);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", update);

  emblem.rotation.y = -0.55;                                // pleasing pose for the static frame
  host.classList.add("is-3d");
  update();
})();
