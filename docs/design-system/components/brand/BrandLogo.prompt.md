The single source of truth for the VelocityMaid logo. Never hand-draw or recolor the mark.

```jsx
<BrandLogo theme="dark" iconSize={28} />              {/* navy header */}
<BrandLogo theme="light" showTagline={false} />        {/* light surface */}
<BrandLogo iconOnly iconSize={24} />                    {/* compact / favicon */}
```

`theme`: `light` (navy house, cyan sparkle — for light backgrounds) or `dark` (cyan house, white sparkle — for navy/dark). The sparkle accent auto-drops at `iconSize <= 32`. Standalone SVG marks also live in `assets/logo/`.
