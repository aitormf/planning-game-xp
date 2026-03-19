# DOM Modern Best Practices

## Element Selection

Use:
```js
.querySelector(selector)      // First element (or null)
.querySelectorAll(selector)   // NodeList (or empty)
.closest(selector)           // First ancestor (or null)
```

Avoid `.getElementById()` or `.getElementsByClassName()` - less flexible than CSS selectors.

## Element Creation & Attributes

```js
.createElement(tag)                  // Create element
.setAttribute(attr, value)           // Set attribute
.getAttribute(attr)                  // Get attribute value
.toggleAttribute(attr, force)        // Toggle attribute
.removeAttribute(attr)               // Remove attribute
```

## Class Management

```js
.classList.add(class)       // Add class(es)
.classList.remove(class)    // Remove class
.classList.toggle(class)    // Toggle class
```

Avoid `.className` - replaces all classes.

## Style Management

```js
.style.setProperty(prop, value)    // Set inline style (preferred)
.style.getPropertyValue(prop)      // Get inline style
.style.removeProperty(prop)        // Remove inline style
```

Use `.setProperty()` over direct assignment for CSS variable support.

## Content Management

```js
.textContent = text              // Set text content (safe)
.innerHTML = html               // Set HTML (⚠ use carefully)
```

## DOM Manipulation

```js
.prepend(element)     // Insert at beginning
.append(element)      // Insert at end
.before(element)      // Insert before
.after(element)       // Insert after
.remove()            // Remove element
.replaceWith(element) // Replace element
```

Avoid `.appendChild()` - use modern methods above.

## Adjacent Insertion

```js
.insertAdjacentElement(position, element)  // Insert element
.insertAdjacentHTML(position, html)       // Insert HTML
.insertAdjacentText(position, text)       // Insert text
```

Positions: `"beforebegin"`, `"afterbegin"`, `"beforeend"`, `"afterend"`
