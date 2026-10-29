# Existing note

## Nested structure

- Parent
  - Nested **bold** and _italic_ with ~~strike~~
- [ ] Open task
- [x] Done task

1. Ordered
2. Second

> Quoted paragraph
>
> Second paragraph

![Photo alt](images/photo_123.png 'Caption')

[Reference][link-id] and ![Referenced photo][photo-id].

[link-id]: https://example.com/path 'Link title'
[photo-id]: images/reference.png 'Photo title'

| Name | Value |
| ---- | ----- |
| Keep | data  |

```javascript
const sample = '<script>literal</script>';
```

<div class="legacy">
  <script>alert('must stay literal')</script>
  <custom-tag>Unsupported HTML</custom-tag>
</div>

Before <unknown attribute="value">inline</unknown> after.

Unrecognized notation: $x^2$, :custom:, [^footnote].

[^footnote]: Existing footnote text.
