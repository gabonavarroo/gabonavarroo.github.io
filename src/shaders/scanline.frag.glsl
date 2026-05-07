precision highp float;

// Applied over the About section photo.
uniform float u_time;
uniform sampler2D u_photo;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Desaturate photo.
  vec4 photo = texture2D(u_photo, uv);
  float lum = dot(photo.rgb, vec3(0.299, 0.587, 0.114));
  vec3 grey = vec3(lum);

  // Cyan color grade.
  vec3 graded = mix(grey, vec3(0.0, 0.83, 1.0), 0.25);

  // Scan lines: horizontal bands moving down.
  float scanline = step(0.5, fract(uv.y * 80.0 - u_time * 0.2));
  graded *= 0.88 + scanline * 0.12;

  // Vignette.
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 1.5;
  graded *= vignette;

  gl_FragColor = vec4(graded, photo.a);
}
