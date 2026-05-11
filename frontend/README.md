## Frontend


```bash
cd frontend
npm install
npm run dev


## Style

The frontend uses [Tailwind CSS](https://tailwindcss.com/) with a custom colour palette defined in `frontend/tailwind.config.js`:

| Token       | Hex       | Usage                         |
|-------------|-----------|-------------------------------|
| `base`      | `#753918` | Dark brown — sidebar, headers |
| `primary`   | `#f7c35f` | Gold — primary buttons, highlights |
| `secondary` | `#ebcf8a` | Light gold — hover states, badges |
| `special`   | `#5366c2` | Blue — status indicators, links |

Components are kept in 
`frontend/src/components/`. 
Pages live in `frontend/src/pages/` and are split by role: `applicant/`, `staff/`, and `admin/`. There are no third-party UI libraries; everything is Tailwind utility classes.

---