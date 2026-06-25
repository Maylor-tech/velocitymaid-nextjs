Field wrapper: label, required asterisk, help text, and error. Wrap any control.

```jsx
<FormRow label="Phone" required helpText="We text arrival updates">
  <Input type="tel" />
</FormRow>
<FormRow label="ZIP" error="Not in our service area"><Input invalid /></FormRow>
```
Error replaces help text when present.
