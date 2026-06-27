Approved VelocityMaid CTA button — use for every primary/secondary action; never hand-roll button styles.

```jsx
<Button variant="navy">Book Now</Button>
<Button variant="cyan" pill iconRight={<ArrowRight />}>Get a quote</Button>
<Button variant="navyOutline" size="lg">Learn more</Button>
<Button variant="ghost">Cancel</Button>
```

Variants: `navy` (primary CTA, navy fill / white text), `cyan` (accent CTA, cyan fill / navy text), `navyOutline` (secondary), `ghost` and `link` (quiet). Sizes `sm | md | lg`. Pass `pill` for fully-rounded marketing CTAs, `fullWidth` to stretch. Labels are auto-uppercased with wide tracking in Space Grotesk (ghost/link stay sentence case).
