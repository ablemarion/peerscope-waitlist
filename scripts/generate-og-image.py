#!/usr/bin/env python3
"""Generate OG image PNG from SVG for Peerscope agency portal."""

import cairosvg
import os

SVG_CONTENT = '''<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dot grid texture -->
    <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1" fill="#FAFAF6" fill-opacity="0.06"/>
    </pattern>
    <!-- Radial amber glow - left -->
    <radialGradient id="glow-left" cx="25%" cy="50%" r="60%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
    <!-- Subtle right glow -->
    <radialGradient id="glow-right" cx="85%" cy="40%" r="45%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#1E40AF" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1E40AF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0F172A"/>

  <!-- Dot grid -->
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Left amber glow -->
  <ellipse cx="300" cy="315" rx="580" ry="360" fill="url(#glow-left)"/>

  <!-- Right subtle glow -->
  <ellipse cx="1020" cy="250" rx="420" ry="320" fill="url(#glow-right)"/>

  <!-- Top amber accent bar -->
  <rect x="0" y="0" width="1200" height="4" fill="#F59E0B" fill-opacity="0.7"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="4" height="630" fill="#F59E0B" fill-opacity="0.2"/>

  <!-- Decorative orbit rings - right side -->
  <circle cx="1050" cy="480" r="220" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.06" fill="none"/>
  <circle cx="1050" cy="480" r="155" stroke="#60A5FA" stroke-width="1" stroke-opacity="0.05" fill="none"/>
  <circle cx="1050" cy="480" r="90" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.08" fill="none"/>

  <!-- Crosshair / scope icon - right decorative -->
  <circle cx="1050" cy="480" r="32" stroke="#F59E0B" stroke-width="1.5" stroke-opacity="0.15" fill="none"/>
  <line x1="1050" y1="448" x2="1050" y2="460" stroke="#F59E0B" stroke-width="1.5" stroke-opacity="0.2" stroke-linecap="round"/>
  <line x1="1050" y1="500" x2="1050" y2="512" stroke="#F59E0B" stroke-width="1.5" stroke-opacity="0.2" stroke-linecap="round"/>
  <line x1="1018" y1="480" x2="1030" y2="480" stroke="#F59E0B" stroke-width="1.5" stroke-opacity="0.2" stroke-linecap="round"/>
  <line x1="1070" y1="480" x2="1082" y2="480" stroke="#F59E0B" stroke-width="1.5" stroke-opacity="0.2" stroke-linecap="round"/>
  <circle cx="1050" cy="480" r="6" fill="#F59E0B" fill-opacity="0.3"/>

  <!-- AGENCY PORTAL badge -->
  <rect x="72" y="62" width="228" height="40" rx="20" fill="#F59E0B" fill-opacity="0.1" stroke="#F59E0B" stroke-width="1.5" stroke-opacity="0.4"/>
  <text
    x="186" y="87"
    text-anchor="middle"
    font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
    font-size="11"
    font-weight="700"
    fill="#F59E0B"
    letter-spacing="3"
  >AGENCY PORTAL</text>

  <!-- Main headline line 1 -->
  <text
    x="72" y="220"
    font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
    font-size="62"
    font-weight="700"
    fill="#F8FAFC"
    letter-spacing="-1.5"
  >Competitive Intelligence</text>

  <!-- Main headline line 2 - amber accent -->
  <text
    x="72" y="300"
    font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
    font-size="62"
    font-weight="700"
    fill="#F59E0B"
    letter-spacing="-1.5"
  >Portal for Agencies.</text>

  <!-- Divider line -->
  <line x1="72" y1="332" x2="200" y2="332" stroke="#60A5FA" stroke-width="2" stroke-opacity="0.4"/>

  <!-- Subline -->
  <text
    x="72" y="376"
    font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
    font-size="24"
    font-weight="400"
    fill="#CBD5E1"
    letter-spacing="-0.3"
  >White-label reports. Client logins. AUD$249/mo.</text>

  <!-- Feature pills -->
  <rect x="72" y="420" width="170" height="36" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <text x="157" y="443" text-anchor="middle" font-family="'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="500" fill="#94A3B8">Competitor tracking</text>

  <rect x="254" y="420" width="148" height="36" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <text x="328" y="443" text-anchor="middle" font-family="'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="500" fill="#94A3B8">White-label UI</text>

  <rect x="414" y="420" width="130" height="36" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <text x="479" y="443" text-anchor="middle" font-family="'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="500" fill="#94A3B8">Client portals</text>

  <!-- Bottom URL -->
  <text
    x="72" y="574"
    font-family="'Courier New', monospace"
    font-size="13"
    font-weight="400"
    fill="#F8FAFC"
    fill-opacity="0.2"
    letter-spacing="0.5"
  >peerscope-waitlist.pages.dev/portal</text>

  <!-- Wordmark - bottom right -->
  <!-- Scope icon -->
  <circle cx="934" cy="558" r="22" stroke="#F8FAFC" stroke-width="2" fill="none" stroke-opacity="0.8"/>
  <circle cx="934" cy="558" r="7" fill="#F59E0B"/>
  <line x1="934" y1="536" x2="934" y2="547" stroke="#F8FAFC" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8"/>
  <line x1="934" y1="569" x2="934" y2="580" stroke="#F8FAFC" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8"/>
  <line x1="912" y1="558" x2="923" y2="558" stroke="#F8FAFC" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8"/>
  <line x1="945" y1="558" x2="956" y2="558" stroke="#F8FAFC" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8"/>

  <!-- peer -->
  <text x="968" y="566" font-family="'Segoe UI', system-ui, sans-serif" font-size="24" font-weight="400" fill="#F8FAFC" fill-opacity="0.85">peer</text>
  <!-- scope -->
  <text x="1020" y="566" font-family="'Segoe UI', system-ui, sans-serif" font-size="24" font-weight="700" fill="#F59E0B">scope</text>

</svg>'''

output_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'public', 'og-image.png'
)

print(f"Generating OG image PNG -> {output_path}")

cairosvg.svg2png(
    bytestring=SVG_CONTENT.encode('utf-8'),
    write_to=output_path,
    output_width=1200,
    output_height=630,
)

print("Done. Verifying...")
import struct, zlib

with open(output_path, 'rb') as f:
    header = f.read(8)
    assert header == b'\x89PNG\r\n\x1a\n', "Not a valid PNG"
    f.read(4)  # length
    chunk = f.read(4)  # IHDR
    width = struct.unpack('>I', f.read(4))[0]
    height = struct.unpack('>I', f.read(4))[0]

size_kb = os.path.getsize(output_path) / 1024
print(f"  Dimensions: {width}x{height}")
print(f"  File size: {size_kb:.1f} KB")

if width == 1200 and height == 630:
    print("OK: Dimensions correct.")
else:
    print(f"WARNING: Expected 1200x630, got {width}x{height}")
