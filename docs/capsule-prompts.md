# Verity Capsule — image-gen prompts

These are the GPT Image / DALL·E 3 / Midjourney prompts for generating the
Verity Capsule chassis used across the V2 trainer redesign. The chassis is the
"premium handheld gacha device" the user holds and looks at — pill-shaped,
cream-white matte, with an embedded glass screen where the dashboard UI sits.

## Drop the outputs here

```
verity-trainer/public/capsule/
├── capsule-front.png          (from Prompt A)
├── capsule-3q.png             (from Prompt B)
├── capsule-loading.png        (from Prompt C, optional)
└── capsule-product.png        (from Prompt D, marketing)
```

Then ping the dev to wire them up via `src/components/device/Capsule.tsx`
(planned but not yet built — waiting on these PNGs).

---

## Prompt A — Primary chassis (front-on, hero use)

> Premium pill-shaped handheld gaming device, viewed perfectly head-on,
> isometric-flat 3D illustration, pixar-quality clean render. Soft cream-white
> matte chassis with subtle pastel gradient sheens — warm blush pink wash on
> the lower-left curve, soft lilac across the top edge, gentle azure on the
> right side. Large rounded-rectangle glass screen embedded in the front face
> (proportionally taking up ~65% of the front, screen content is empty matte
> black for compositing). Three small circular buttons in soft coral on
> bottom-left arranged vertically. Three small circular buttons in soft azure
> on bottom-right arranged vertically. Tiny etched "VERITY" wordmark above the
> screen in clean geometric sans-serif. Empty triangular badge slot etched into
> top-right corner. Soft ambient drop-shadow below the device. Subtle highlight
> reflections on chassis edges suggesting depth. NO characters. NO UI elements
> on screen. NO text on screen. NO photorealism, NO skeuomorphic textures.
> Transparent background. Aspect ratio 17:10. High detail.

## Prompt B — Alt chassis (3/4 perspective, marketing)

> Same Verity handheld pill-shaped device — cream-white matte chassis, embedded
> rounded-rectangle glass screen, coral and azure circular buttons. Now rotated
> 8 degrees clockwise with a subtle vanishing point toward the lower-right
> corner. Visible thin bezel-edge depth on the top and right sides showing the
> device has thickness. Same pastel highlights (blush lower-left, lilac top,
> azure right). Soft ambient drop-shadow underneath. Transparent background.
> Premium soft-3D illustration style. 17:10 aspect ratio. High detail.

## Prompt C — Loading screen / generating phase

> Same Verity handheld device, now seen from a slight top-down angle as if a
> user is holding it and looking down at the screen. Bottom 70% of the device
> is in frame; the top edge of the chassis dissolves softly into the
> surrounding pastel atmosphere. Background is a dreamy gradient — warm blush
> pink upper-left fading through soft lilac to azure on the right, with a hint
> of warm orange glow lower-left. The device emits a subtle inner glow — coral
> and azure light from the screen reflecting on the chassis edges. Cinematic,
> premium, gacha-mystery atmosphere — like the moment just before a capsule
> reveals what's inside. Soft particle dust floating around the device. NO
> characters. Screen is matte black/empty (we'll composite UI on top). 16:9
> aspect ratio. Atmospheric, photographic depth-of-field.

## Prompt D — Capsule pack (bonus: marketing / app store)

> The same Verity handheld device, but presented like a luxury product photo —
> sitting on a soft pastel surface, three-quarter angle with one corner
> slightly tilted up. The chassis is pristine, cream-white matte. Behind it, a
> clean pastel gradient backdrop (blush to lilac to azure). Soft natural
> lighting from upper-left, casting a long gentle shadow to the right. Hint of
> "Powered by AVAX" embossed subtly on the lower edge of the chassis. Scale:
> device occupies center 60% of frame with breathing room around. Premium
> product render, like an AirPods case or a Loop Earplugs box on Pinterest.
> 16:10 aspect ratio.

---

## Tactical notes

- **Run each prompt 3–4 times** — image gens are non-deterministic. Pick the
  best output per concept.
- **If buttons look messy:** add `flat clean circular buttons, no embossing,
  no text on buttons`
- **If the screen has UI in it:** add `screen is empty matte black, no icons,
  no menus, no text inside the screen rectangle`
- **If the chassis looks too plastic-y:** add `matte velvet-finish chassis,
  soft like ceramic, NOT glossy plastic`
- **If proportions are off:** specify `pill-shape with rounded ends, 1.7:1
  width-to-height ratio, screen is 60% of front face`

## Brand color reference

For consistency across runs:

```
chassis           #FFFDF3  (cream-white matte)
gradient blush    #FFE6E6  (warm pink)
gradient lilac    #F4D2FF  (soft purple)
gradient azure    #C2DDFF  (soft blue)
gradient warm     #FFCB9A  (orange accent)
button coral      #FF6B5C
button azure      #367D95
ink (etching)     #16272C
avax red          #E84142  (reserved, only if AVAX co-branding lands)
```

These match `src/lib/brand.ts`. Feed them to the image gen if it asks for
specific hex codes.

## Licensing reminder

GPT Image / DALL·E / Midjourney outputs are commercially usable under each
provider's TOS. No additional credit required, but verify your account tier
permits commercial use before shipping.
