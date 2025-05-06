<p align="center"><img src="/imgs/TabloForge_banner.png" alt="Sample Image" style="width:50%; height:auto;" align="center"></img></p>

**TabloForge** is a tool that allows you to create **customizable SVG tables** with JSON-based data.  
Server owners can share **live player counts**, **server statuses**, or **event details** in stylish tables on forums or social platforms.

No installation or download required – just a URL is enough! 🎉  
TabloForge lets you create **customizable SVG tables** with JSON-based data!

Server owners can share live player counts, server statuses, or event details in **stylish and readable tables** on forums or social platforms.

Upload your JSON data to a URL, call it with the `json` parameter in the TabloForge link – no installation or download needed! 🎉

TabloForge is fully customizable with **themes**, **icons**, and **color options**.

---

## 🚀 Usage Examples

### 1. Live Player Count (Dark Theme)

![image](https://tablo-forge.vercel.app/api/table?json=https://tablo-forge.vercel.app/examples/example-player-count.json&_theme=dark&_shadow=true)
<details>
<summary>📄 JSON Content</summary>
  
```json
{
  "rows": [
    [
      {"text": "Server", "color": "#4c1"},
      {"text": "Players", "color": "#4c1"},
      {"text": "Status", "color": "#4c1"}
    ],
    [
      {"text": "MyServer", "color": "transparent"},
      {"text": "42", "color": "transparent"},
      {"text": "Online", "icon": "success", "color": "transparent"}
    ]
  ]
}
```

</details>

### 2. Server Status (Light Theme)

![image](https://tablo-forge.vercel.app/api/table?json=https://tablo-forge.vercel.app/examples/example-server-status.json&_theme=light&_shadow=true)
<details>
<summary>📄 JSON Content</summary>
  
```json
{
  "rows": [
    [
      {"text": "Name", "color": "#4c1"},
      {"text": "Status", "color": "#4c1"}
    ],
    [
      {"text": "Alice", "icon": "green dot", "color": "transparent"},
      {"text": "Online", "icon": "check", "color": "transparent"}
    ]
  ]
}
```

</details>

### 3. Event Announcement (Ocean Theme)

![image](https://tablo-forge.vercel.app/api/table?json=https://tablo-forge.vercel.app/examples/example-event.json&_theme=ocean&_size=18&_shadow=true)
<details>
<summary>📄 JSON Content</summary>
  
```json
{
  "rows": [
    [
      {"text": "Event", "color": "#60a5fa"},
      {"text": "Date", "color": "#60a5fa"},
      {"text": "Status", "color": "#60a5fa"}
    ],
    [
      {"text": "PvP Tournament", "color": "transparent"},
      {"text": "2025-05-10", "color": "transparent"},
      {"text": "Upcoming", "icon": "info", "color": "transparent"}
    ]
  ]
}
```

</details>

---

### 4. API Use Cases
#### Cat Facts API Usage
<img src="https://tablo-forge.vercel.app/api/fromapi?api=https://catfact.ninja/fact"></img>
---
#### Random Dog Photo Usage
<img src="https://tablo-forge.vercel.app/api/fromapi?api=https://dog.ceo/api/breeds/image/random&_theme=light"></img>
---
#### Random Quotable Usage
<img src="https://tablo-forge.vercel.app/api/fromapi?api=http://api.quotable.io/random&_theme=nord"></img>
---
#### Timeapi Useage
<img src="https://tablo-forge.vercel.app/api/fromapi?api=https://timeapi.io/api/Time/current/zone?timeZone=Europe/Istanbul&_theme=dracula"></img>


<details>
<summary>📄 Contents</summary>
  
  ```
<img src="https://tablo-forge.vercel.app/api/fromapi?api=https://catfact.ninja/fact"></img>
<img src="https://tablo-forge.vercel.app/api/fromapi?api=https://dog.ceo/api/breeds/image/random&_theme=light"></img>
<img src="https://tablo-forge.vercel.app/api/fromapi?api=http://api.quotable.io/random&_theme=nord"></img>
<img src="https://tablo-forge.vercel.app/api/fromapi?api=https://timeapi.io/api/Time/current/zone?timeZone=Europe/Istanbul&_theme=dracula"></img>
```
</details>


## 🧪 How to Prepare Your Own JSON?

TabloForge works with a simple JSON structure containing a `rows` array:

```json
{
  "rows": [
    [
      {"text": "Header 1", "color": "#4c1"},
      {"text": "Header 2", "color": "#4c1"}
    ],
    [
      {"text": "Data 1", "icon": "success", "color": "transparent"},
      {"text": "Data 2", "icon": "check", "color": "transparent"}
    ]
  ]
}
```

### JSON Fields

* `text`: The text to display in the cell.
* `icon`: (optional) The icon to display in the cell.
* `color`: (optional) Background color (`transparent` is allowed).

### Uploading Your JSON

Upload your JSON file to GitHub, Vercel, or any other CDN service. Example:

```
https://my-website.com/my-table.json
```

Use this URL as follows:

```
https://tablo-forge.vercel.app/api/table?json=https://my-website.com/my-table.json
```

---

## 🎨 Supported Icons

| Name        | Appearance | Description                   |
| ----------- | ---------- | ----------------------------- |
| `success`   | ✅         | Success / active status       |
| `error`     | ❌         | Error / failed operation      |
| `warning`   | ⚠️        | Warning                       |
| `info`      | ℹ️        | Information                   |
| `check`     | ✔️        | Approved content              |
| `offline`   | 🔴        | Offline                       |
| `online`    | 🟢        | Online                        |
| `star`      | ⭐        | Featured content              |
| `fire`      | 🔥        | Popular / hot                 |
| `clock`     | 🕒        | Time info / event             |
| `green dot` | 🟢        | Available user                |
| `red dot`   | 🔴        | Busy / offline user           |

You can suggest new icons!

---

## 📌 Notes

* The JSON file must be publicly accessible via a URL.
* The `transparent` color makes the cell blend with the theme background.
* For more features, you can use the [issues](https://github.com/veyselfirat/tabloforge/issues) section.

---

## 🛠️ Developer

**Kantrveysel**  
[GitHub](https://github.com/veyselfirat)  

[TabloForge](https://tablo-forge.vercel.app)
