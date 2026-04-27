# CSS ARCHIVISTA NEXT — RAW DUMP — 2026-04-26

## 0. RIASSUNTO
- File CSS trovati: 2
- Selettori iai-* totali: 176
- Variabili CSS usate: 0

## 1. FILE CSS — DUMP INTEGRALE
### 1.1 src/next/internal-ai/internal-ai.css (importato da src/next/NextIAArchivistaPage.tsx:11)
```css
.internal-ai-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.internal-ai-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.internal-ai-hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
}

.internal-ai-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.internal-ai-nav--minimal {
  gap: 8px;
}

.internal-ai-nav__secondary {
  position: relative;
}

.internal-ai-nav__secondary summary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 9px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  color: #5d4d35;
  background: rgba(141, 114, 76, 0.08);
  list-style: none;
}

.internal-ai-nav__secondary summary::-webkit-details-marker {
  display: none;
}

.internal-ai-nav__secondary-links {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: #fffdf8;
  box-shadow: 0 16px 32px rgba(47, 38, 24, 0.12);
}

.internal-ai-nav__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 14px;
  border-radius: 999px;
  text-decoration: none;
  color: #5d4d35;
  font-weight: 700;
  background: rgba(141, 114, 76, 0.12);
}

.internal-ai-nav__link.is-active {
  background: #2f2618;
  color: #fff8ee;
}

.internal-ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.internal-ai-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: #fff;
}

.internal-ai-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b6c3d;
}

.internal-ai-card__meta {
  margin: 10px 0 0;
  color: #6b5c45;
  font-size: 13px;
}

.internal-ai-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.internal-ai-archive {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.internal-ai-archive__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 1fr);
  gap: 16px;
  align-items: end;
}

.internal-ai-archive__summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.88);
}

.internal-ai-archive__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}

.internal-ai-chat {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.internal-ai-chat--primary {
  gap: 18px;
}

.internal-ai-chat__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) auto;
  gap: 12px;
  align-items: end;
}

.internal-ai-chat__status-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  align-items: stretch;
}

.internal-ai-chat__status-chip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 84px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: linear-gradient(180deg, #fff, #faf6ef);
}

.internal-ai-chat__status-chip.is-positive {
  border-color: rgba(92, 122, 82, 0.28);
  background: linear-gradient(180deg, #f4f8ef, #ffffff);
}

.internal-ai-chat__status-chip.is-warning {
  border-color: rgba(176, 126, 27, 0.24);
  background: linear-gradient(180deg, #fff6e2, #ffffff);
}

.internal-ai-chat__status-chip.is-neutral {
  background: linear-gradient(180deg, #faf6ef, #ffffff);
}

.internal-ai-chat__shell {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(300px, 0.85fr);
  gap: 18px;
  align-items: start;
}

.internal-ai-chat__main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.internal-ai-chat__aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 12px;
}

.internal-ai-chat__aside .internal-ai-card {
  border-color: rgba(110, 85, 51, 0.1);
  box-shadow: 0 10px 22px rgba(47, 38, 24, 0.05);
}

.internal-ai-chat__status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.internal-ai-chat__status-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.94);
}

.internal-ai-chat__status-card.is-positive {
  border-color: rgba(92, 122, 82, 0.28);
  background: linear-gradient(180deg, #f4f8ef, #ffffff);
}

.internal-ai-chat__status-card.is-warning {
  border-color: rgba(176, 126, 27, 0.24);
  background: linear-gradient(180deg, #fff6e2, #ffffff);
}

.internal-ai-chat__status-card.is-neutral {
  background: linear-gradient(180deg, #faf6ef, #ffffff);
}

.internal-ai-chat__guide {
  background: linear-gradient(180deg, rgba(255, 249, 239, 0.96), rgba(255, 255, 255, 0.98));
}

.internal-ai-chat__status-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.internal-ai-chat__message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.internal-ai-chat__attachment-pill {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(92, 122, 82, 0.2);
  background: #f4f8ef;
  color: #35512d;
  font-weight: 700;
  cursor: pointer;
}

.internal-ai-chat__attachment-pill span {
  font-size: 12px;
  font-weight: 600;
  color: #6b5c45;
}

.internal-ai-chat__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.internal-ai-chat__suggestion {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(110, 85, 51, 0.16);
  background: #f6f0e4;
  color: #4d412e;
  font-weight: 700;
  cursor: pointer;
}

.internal-ai-chat__suggestion.is-selected {
  background: #2f2618;
  border-color: #2f2618;
  color: #fff8ee;
}

.internal-ai-chat__messages {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 280px;
  max-height: 620px;
  overflow: auto;
  padding: 6px 6px 6px 0;
}

.internal-ai-chat__empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 220px;
  padding: 20px 18px;
  border: 1px dashed rgba(110, 85, 51, 0.18);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
}

.internal-ai-chat__empty-title,
.internal-ai-chat__empty-copy {
  margin: 0;
}

.internal-ai-chat__empty-title {
  color: #2f2618;
  font-size: 16px;
  font-weight: 700;
}

.internal-ai-chat__empty-copy {
  color: #6b5c45;
  line-height: 1.55;
}

.internal-ai-chat__message {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  box-shadow: 0 12px 28px rgba(63, 45, 19, 0.06);
}

.internal-ai-chat__message.is-user {
  align-self: flex-end;
  width: min(100%, 760px);
  background: linear-gradient(180deg, #efe2ca, #f8efe0);
}

.internal-ai-chat__message.is-assistant {
  align-self: flex-start;
  width: min(100%, 860px);
  background: rgba(255, 255, 255, 0.94);
}

.internal-ai-chat__message-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.internal-ai-chat__message-text {
  margin: 0;
  white-space: pre-wrap;
  color: #2f2618;
  line-height: 1.65;
  font-size: 15px;
}

.internal-ai-chat__message-delivery {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.internal-ai-chat__message-reason {
  color: #6b5c45;
  font-size: 13px;
  line-height: 1.5;
}

.internal-ai-chat[hidden],
.internal-ai-grid[hidden],
.internal-ai-secondary-panel[hidden],
.internal-ai-unified-documents__tab-panel[hidden] {
  display: none !important;
}

.internal-ai-unified-documents {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
}

.internal-ai-unified-documents.is-review-active {
  height: calc(100vh - 182px);
}

@media (min-width: 1101px) {
  html:has(.internal-ai-unified-documents.is-review-active),
  body:has(.internal-ai-unified-documents.is-review-active) {
    overflow: hidden;
  }
}

.internal-ai-unified-documents__hero,
.internal-ai-unified-documents__route-note,
.internal-ai-unified-documents__history-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.internal-ai-unified-documents__hero h1,
.internal-ai-unified-documents__route-note h2,
.internal-ai-unified-documents__history-head h2,
.internal-ai-unified-documents__review-head h3 {
  margin: 0;
  color: #2f2618;
}

.internal-ai-unified-documents__hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.internal-ai-unified-documents__layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.internal-ai-unified-documents.is-review-active .internal-ai-unified-documents__layout {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.internal-ai-unified-documents__entry,
.internal-ai-unified-documents__tab-panel,
.internal-ai-unified-documents__history-sheet {
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: linear-gradient(180deg, rgba(255, 250, 242, 0.98), rgba(255, 255, 255, 0.98));
  box-shadow: 0 18px 36px rgba(47, 38, 24, 0.06);
}

.internal-ai-unified-documents__entry {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 12px;
}

.internal-ai-unified-documents.is-review-active .internal-ai-unified-documents__entry {
  max-height: 100%;
  overflow: auto;
}

.internal-ai-unified-documents__panel-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.internal-ai-unified-documents__panel-head h2 {
  margin: 0;
  color: #2f2618;
}

.internal-ai-unified-documents__panel-head span {
  color: #6b5c45;
  font-size: 14px;
  line-height: 1.55;
}

.internal-ai-unified-documents__upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
  border: 1px dashed rgba(110, 85, 51, 0.22);
  background: rgba(255, 255, 255, 0.86);
  cursor: pointer;
}

.internal-ai-unified-documents__upload input {
  width: 100%;
}

.internal-ai-unified-documents__engine-card,
.internal-ai-unified-documents__destination-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

.internal-ai-unified-documents__destination-card.is-secondary {
  background: linear-gradient(180deg, #f6efe3, #ffffff);
}

.internal-ai-unified-documents__label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b6c3d;
}

.internal-ai-unified-documents__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.internal-ai-unified-documents__tabs,
.internal-ai-unified-documents__history-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.internal-ai-unified-documents__tab,
.internal-ai-unified-documents__history-filter {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(110, 85, 51, 0.14);
  background: #f6f0e4;
  color: #5d4d35;
  font-weight: 700;
  cursor: pointer;
}

.internal-ai-unified-documents__tab.is-active,
.internal-ai-unified-documents__history-filter.is-active {
  background: #2f2618;
  border-color: #2f2618;
  color: #fff8ee;
}

.internal-ai-unified-documents__tab-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
}

.internal-ai-unified-documents.is-review-active .internal-ai-unified-documents__tab-panel {
  flex: 1;
  overflow: hidden;
}

.internal-ai-unified-documents__review-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  min-height: 0;
  align-items: stretch;
}

.internal-ai-unified-documents__review-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.internal-ai-unified-documents__review-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.internal-ai-unified-documents__review-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
}

.internal-ai-unified-documents__review-card-body {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
  overflow: auto;
  padding-right: 4px;
}

.internal-ai-unified-documents__review-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid rgba(110, 85, 51, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 250, 242, 0.96));
}

.internal-ai-unified-documents__review-card-footer .internal-ai-search__button {
  flex: 1 1 180px;
}

.internal-ai-unified-documents__review-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: top center;
  display: block;
  background: #faf6ef;
}

.internal-ai-unified-documents__review-preview.is-placeholder {
  display: grid;
  place-items: center;
  padding: 32px 20px;
  font-size: 12px;
  color: #8b6c3d;
  background: #faf6ef;
  border: 0.5px solid rgba(110, 85, 51, 0.12);
  border-radius: 12px;
  min-height: 300px;
}

.internal-ai-unified-documents__facts {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin: 0;
}

.internal-ai-unified-documents__facts div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #faf6ef;
}

.internal-ai-unified-documents__facts dt {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #8b6c3d;
}

.internal-ai-unified-documents__facts dd {
  margin: 0;
  color: #2f2618;
  font-weight: 700;
}

.internal-ai-unified-documents__rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.internal-ai-unified-documents__rows-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.internal-ai-unified-documents__row {
  display: grid;
  grid-template-columns: 18px 1fr 60px 70px 70px 90px;
  gap: 8px;
  align-items: center;
  padding: 9px 0;
  border-bottom: 0.5px solid rgba(110, 85, 51, 0.1);
  transition: opacity 0.15s;
}

.internal-ai-unified-documents__row:last-of-type {
  border-bottom: none;
}

.internal-ai-unified-documents__row.is-off {
  opacity: 0.3;
}

.internal-ai-unified-documents__row input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: #1d9e75;
  cursor: pointer;
}

.internal-ai-unified-documents__row .row-desc {
  font-size: 12px;
  font-weight: 500;
  color: #2f2618;
  line-height: 1.3;
}

.internal-ai-unified-documents__row .row-qta,
.internal-ai-unified-documents__row .row-pru,
.internal-ai-unified-documents__row .row-tot {
  font-size: 12px;
  color: #6b5c45;
  text-align: right;
}

.internal-ai-unified-documents__row .row-tot {
  font-weight: 500;
  color: #2f2618;
}

.internal-ai-unified-documents__row .row-cod {
  font-size: 11px;
  color: #8b6c3d;
  text-align: right;
}

.internal-ai-unified-documents__history-copy strong {
  color: #2f2618;
}

.internal-ai-unified-documents__history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.internal-ai-unified-documents__history-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

.internal-ai-unified-documents__history-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: min(100%, 320px);
}

.internal-ai-unified-documents__details {
  padding: 0;
}

.internal-ai-unified-documents__details summary {
  cursor: pointer;
  font-weight: 700;
  color: #5d4d35;
}

.internal-ai-unified-documents__details p {
  margin: 10px 0 0;
  color: #6b5c45;
  line-height: 1.6;
  white-space: pre-wrap;
}

.internal-ai-unified-documents__inline-error {
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(176, 27, 27, 0.18);
  background: #fff0f0;
  color: #8a1e1e;
  font-weight: 600;
}

.internal-ai-unified-documents__empty-review {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 20px;
  border-radius: 22px;
  border: 1px dashed rgba(110, 85, 51, 0.18);
  background: rgba(255, 255, 255, 0.72);
}

.internal-ai-unified-documents__empty-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #2f2618;
}

.internal-ai-unified-documents__history-modal {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: 18px;
}

.internal-ai-unified-documents__history-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(16, 12, 7, 0.44);
}

.internal-ai-unified-documents__history-sheet {
  position: relative;
  z-index: 1;
  width: min(1100px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.internal-ai-unified-documents__route-note {
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: linear-gradient(180deg, #faf3e6, #ffffff);
}

.internal-ai-chat__composer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(110, 85, 51, 0.14);
  background: linear-gradient(180deg, rgba(250, 245, 237, 0.98), rgba(255, 255, 255, 0.99));
  box-shadow: 0 14px 28px rgba(47, 38, 24, 0.06);
}

.internal-ai-chat__composer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.internal-ai-chat__composer-input {
  min-height: 120px;
  padding: 14px;
  resize: vertical;
  line-height: 1.55;
}

.internal-ai-chat__composer-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.internal-ai-chat__attachments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.internal-ai-chat__attachment-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.88);
}

.internal-ai-chat__attachment-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: min(100%, 320px);
}

.internal-ai-home-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 18px;
}

.internal-ai-home-modal__panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
  min-height: 0;
}

.internal-ai-home-modal__lead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.internal-ai-home-modal__lead h2 {
  margin: 0;
  color: #2f2618;
}

.internal-ai-home-modal__transport {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.internal-ai-home-modal__conversation {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.internal-ai-chat__document-proposal-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 220px;
  max-height: min(52vh, 680px);
  overflow: auto;
  padding-right: 6px;
  scroll-margin-top: 12px;
}

.internal-ai-chat__document-proposal-shell.is-home-modal {
  max-height: min(48vh, 560px);
}

.internal-ai-chat__document-proposal-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 22px;
  border: 1px solid rgba(110, 85, 51, 0.14);
  background: linear-gradient(180deg, rgba(255, 251, 243, 0.98), rgba(255, 255, 255, 0.98));
  box-shadow: 0 10px 24px rgba(47, 38, 24, 0.07);
}

.internal-ai-chat__document-proposal-card.is-ready {
  border-color: rgba(92, 122, 82, 0.22);
}

.internal-ai-chat__document-proposal-card.is-warning {
  border-color: rgba(176, 126, 27, 0.26);
  background: linear-gradient(180deg, rgba(255, 247, 230, 0.98), rgba(255, 255, 255, 0.98));
}

.internal-ai-chat__document-proposal-card.is-loading {
  border-color: rgba(110, 85, 51, 0.18);
}

.internal-ai-chat__document-proposal-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.internal-ai-chat__document-proposal-title {
  margin: 0;
  font-size: 23px;
  line-height: 1.2;
  color: #2f2618;
  word-break: break-word;
}

.internal-ai-chat__document-dossier {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.internal-ai-chat__document-dossier-header {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 1fr);
  gap: 16px;
  align-items: start;
}

.internal-ai-chat__document-dossier-header-main,
.internal-ai-chat__document-dossier-header-side,
.internal-ai-chat__document-dossier-main,
.internal-ai-chat__document-dossier-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.internal-ai-chat__document-dossier-file {
  margin: 0;
  font-size: 14px;
  color: #5d4d35;
  word-break: break-word;
}

.internal-ai-chat__document-dossier-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.internal-ai-chat__document-dossier-meta-card,
.internal-ai-chat__document-dossier-fact-card,
.internal-ai-chat__document-dossier-data-card,
.internal-ai-chat__document-dossier-highlight {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 90px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.1);
  background: rgba(255, 255, 255, 0.88);
}

.internal-ai-chat__document-dossier-meta-card strong,
.internal-ai-chat__document-dossier-fact-card strong,
.internal-ai-chat__document-dossier-data-card strong,
.internal-ai-chat__document-dossier-highlight strong {
  color: #2f2618;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

.internal-ai-chat__document-dossier-section,
.internal-ai-chat__document-dossier-final-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.internal-ai-chat__document-dossier-section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 12px;
}

.internal-ai-chat__document-dossier-section-head h4 {
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
  color: #2f2618;
}

.internal-ai-chat__document-dossier-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.internal-ai-chat__document-dossier-body {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr);
  gap: 18px;
  align-items: start;
}

.internal-ai-chat__document-dossier-interpretation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.internal-ai-chat__document-dossier-highlight {
  min-height: 0;
  padding: 16px 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 247, 239, 0.9));
}

.internal-ai-chat__document-dossier-highlight.is-secondary {
  background: rgba(249, 244, 234, 0.94);
}

.internal-ai-chat__document-dossier-highlight .internal-ai-card__meta,
.internal-ai-chat__document-dossier-data-card .internal-ai-card__meta {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
}

.internal-ai-chat__document-dossier-alert {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(176, 126, 27, 0.24);
  background: rgba(255, 248, 233, 0.95);
}

.internal-ai-chat__document-dossier-data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.internal-ai-chat__document-dossier-fact-card.is-positive,
.internal-ai-chat__document-dossier-data-card.is-positive {
  border-color: rgba(92, 122, 82, 0.22);
  background: rgba(238, 247, 232, 0.92);
}

.internal-ai-chat__document-dossier-fact-card.is-warning,
.internal-ai-chat__document-dossier-data-card.is-warning,
.internal-ai-chat__document-dossier-items-row.is-warning {
  border-color: rgba(176, 126, 27, 0.22);
  background: rgba(255, 247, 230, 0.92);
}

.internal-ai-chat__document-dossier-items-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.internal-ai-chat__document-dossier-items-head,
.internal-ai-chat__document-dossier-items-row {
  display: grid;
  grid-template-columns: minmax(180px, 2.2fr) repeat(5, minmax(80px, 1fr));
  gap: 10px;
  align-items: start;
}

.internal-ai-chat__document-dossier-items-head {
  padding: 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b6c3d;
}

.internal-ai-chat__document-dossier-items-row {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.1);
  background: rgba(255, 255, 255, 0.88);
}

.internal-ai-chat__document-dossier-items-row strong,
.internal-ai-chat__document-dossier-items-row span {
  line-height: 1.45;
  color: #2f2618;
  word-break: break-word;
}

.internal-ai-chat__document-dossier-empty {
  padding: 16px;
  border-radius: 16px;
  border: 1px dashed rgba(110, 85, 51, 0.18);
  background: rgba(255, 255, 255, 0.7);
  color: #5d4d35;
  line-height: 1.55;
}

.internal-ai-chat__document-dossier-match-stack {
  display: grid;
  gap: 10px;
}

.internal-ai-chat__document-dossier-evidence {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(248, 244, 236, 0.92);
}

.internal-ai-chat__document-dossier-evidence pre {
  margin: 0;
  max-height: 180px;
  overflow: auto;
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: #473929;
  white-space: pre-wrap;
  word-break: break-word;
}

.internal-ai-chat__document-dossier-final-box {
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(92, 122, 82, 0.18);
  background: linear-gradient(180deg, rgba(239, 246, 231, 0.94), rgba(255, 255, 255, 0.96));
}

.internal-ai-chat__document-dossier-final-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.internal-ai-chat__document-dossier-final-content .internal-ai-card__meta {
  margin: 0;
  line-height: 1.55;
}

.internal-ai-chat__document-dossier-inline-state {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.14);
  background: rgba(255, 255, 255, 0.9);
}

.internal-ai-chat__document-dossier-inline-state strong {
  color: #2f2618;
  line-height: 1.4;
}

.internal-ai-chat__document-dossier-inline-state.is-positive {
  border-color: rgba(92, 122, 82, 0.24);
  background: rgba(238, 247, 232, 0.94);
}

.internal-ai-chat__document-dossier-inline-state.is-warning {
  border-color: rgba(176, 126, 27, 0.24);
  background: rgba(255, 247, 230, 0.94);
}

.internal-ai-chat__document-dossier-inline-state.is-neutral {
  border-color: rgba(110, 85, 51, 0.16);
  background: rgba(248, 244, 236, 0.92);
}

.internal-ai-chat__document-dossier-inline-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.internal-ai-chat__document-dossier-inline-result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.internal-ai-chat__document-proposal-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.internal-ai-chat__document-proposal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 84px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(110, 85, 51, 0.1);
  background: rgba(255, 255, 255, 0.82);
}

.internal-ai-chat__document-proposal-field strong {
  color: #2f2618;
  line-height: 1.35;
  word-break: break-word;
}

.internal-ai-chat__document-proposal-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b6c3d;
}

.internal-ai-chat__document-proposal-copy {
  display: grid;
  gap: 8px;
}

.internal-ai-chat__document-proposal-copy .internal-ai-card__meta {
  margin-top: 0;
  font-size: 13px;
  line-height: 1.55;
}

.internal-ai-chat__document-proposal-actions {
  align-items: center;
}

.internal-ai-home-modal__messages {
  flex: 1;
  min-height: 0;
  max-height: none;
  padding-right: 6px;
}

.internal-ai-home-modal__composer-shell {
  flex: 0 0 auto;
}

.internal-ai-home-modal__composer {
  margin-top: auto;
}

.internal-ai-chat__secondary {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.84);
}

.internal-ai-chat__secondary summary {
  cursor: pointer;
  font-weight: 800;
  color: #4d412e;
}

.internal-ai-chat__secondary[open] summary {
  margin-bottom: 4px;
}

.internal-ai-chat__references {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.internal-ai-chat__reference {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(92, 122, 82, 0.24);
  background: #f4f8ef;
  color: #35512d;
  font-weight: 700;
  cursor: pointer;
}

.internal-ai-chat__reference:hover {
  background: #e8f1df;
}

.internal-ai-search__button--secondary {
  background: #f3eee5;
  border-color: rgba(110, 85, 51, 0.14);
  color: #5d4d35;
}

.internal-ai-filter-chip {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(110, 85, 51, 0.14);
  background: #f6f1e7;
  color: #5d4d35;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease,
    box-shadow 120ms ease;
}

.internal-ai-filter-chip.is-active {
  border-color: rgba(92, 122, 82, 0.34);
  background: #eaf3df;
  color: #35512d;
  box-shadow: inset 0 0 0 1px rgba(92, 122, 82, 0.12);
}

.internal-ai-filter-chip:hover {
  border-color: rgba(92, 122, 82, 0.22);
}

.internal-ai-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.internal-ai-document {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.internal-ai-document__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.internal-ai-review-modal {
  position: fixed;
  inset: 0;
  z-index: 1210;
  padding: 14px;
}

.internal-ai-review-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(28, 21, 11, 0.62);
  cursor: pointer;
}

.internal-ai-review-modal__sheet {
  position: relative;
  z-index: 1;
  width: 100%;
  height: calc(100vh - 28px);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(255, 247, 231, 0.96), transparent 36%),
    linear-gradient(180deg, rgba(252, 247, 239, 0.99), rgba(244, 238, 229, 0.98));
  box-shadow: 0 28px 90px rgba(24, 18, 8, 0.28);
  overflow: hidden;
}

.internal-ai-review-modal__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.internal-ai-review-modal__toolbar-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.internal-ai-review-modal__toolbar-main h2 {
  margin: 0;
  font-size: 31px;
  line-height: 1.15;
  color: #2f2618;
}

.internal-ai-review-modal__route-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.internal-ai-review-modal__route-tab {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.14);
  background: rgba(255, 255, 255, 0.84);
  color: #4d412e;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

.internal-ai-review-modal__route-tab strong {
  color: #2f2618;
}

.internal-ai-review-modal__route-tab span {
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}

.internal-ai-review-modal__route-tab.is-active {
  border-color: rgba(92, 122, 82, 0.3);
  box-shadow: 0 10px 20px rgba(52, 71, 40, 0.12);
  transform: translateY(-1px);
}

.internal-ai-review-modal__content {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) minmax(380px, 0.94fr);
  gap: 18px;
}

.internal-ai-review-modal__preview-pane,
.internal-ai-review-modal__review-pane {
  min-height: 0;
  border-radius: 24px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.92);
}

.internal-ai-review-modal__preview-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(57, 48, 34, 0.05), rgba(57, 48, 34, 0.02)),
    rgba(255, 255, 255, 0.94);
}

.internal-ai-review-modal__preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(110, 85, 51, 0.12);
}

.internal-ai-review-modal__preview-surface {
  flex: 1;
  min-height: 0;
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(247, 242, 234, 0.96), rgba(241, 236, 227, 0.98));
}

.internal-ai-review-modal__preview-frame,
.internal-ai-review-modal__text-preview,
.internal-ai-review-modal__image-scroller {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 1px solid rgba(110, 85, 51, 0.14);
  border-radius: 20px;
  background: #f7f1e7;
}

.internal-ai-review-modal__preview-frame {
  display: block;
}

.internal-ai-review-modal__image-scroller {
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 18px;
}

.internal-ai-review-modal__image {
  display: block;
  max-width: none;
  height: auto;
  border-radius: 14px;
  box-shadow: 0 14px 32px rgba(25, 18, 8, 0.16);
}

.internal-ai-review-modal__text-preview {
  margin: 0;
  overflow: auto;
  padding: 18px;
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #3d3123;
  white-space: pre-wrap;
  word-break: break-word;
}

.internal-ai-review-modal__review-pane {
  overflow: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.internal-ai-review-modal__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(110, 85, 51, 0.1);
  background: rgba(255, 253, 250, 0.92);
}

.internal-ai-review-modal__section--hero {
  background: linear-gradient(180deg, rgba(255, 249, 240, 0.96), rgba(255, 255, 255, 0.98));
}

.internal-ai-review-modal__section--priority {
  border-color: rgba(110, 85, 51, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 249, 240, 0.96), rgba(255, 255, 255, 0.98));
}

.internal-ai-review-modal__section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 12px;
}

.internal-ai-review-modal__section-head h3,
.internal-ai-review-modal__section-head h4 {
  margin: 0;
  color: #2f2618;
}

.internal-ai-review-modal__facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.internal-ai-review-modal__facts-grid--summary {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.internal-ai-review-modal__fact-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 92px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.1);
  background: rgba(255, 255, 255, 0.92);
}

.internal-ai-review-modal__fact-card strong {
  color: #2f2618;
  line-height: 1.45;
  word-break: break-word;
}

.internal-ai-review-modal__fact-card.is-positive {
  border-color: rgba(92, 122, 82, 0.24);
  background: rgba(237, 247, 233, 0.94);
}

.internal-ai-review-modal__fact-card.is-warning {
  border-color: rgba(176, 126, 27, 0.24);
  background: rgba(255, 247, 230, 0.94);
}

.internal-ai-review-modal__status-banner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.94);
}

.internal-ai-review-modal__status-banner strong,
.internal-ai-review-modal__status-banner p {
  margin: 0;
  color: #2f2618;
}

.internal-ai-review-modal__status-banner p {
  line-height: 1.5;
}

.internal-ai-review-modal__status-banner.is-positive {
  border-color: rgba(92, 122, 82, 0.24);
  background: rgba(237, 247, 233, 0.94);
}

.internal-ai-review-modal__status-banner.is-warning {
  border-color: rgba(176, 126, 27, 0.24);
  background: rgba(255, 247, 230, 0.94);
}

.internal-ai-review-modal__rows-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.1);
  background: rgba(255, 255, 255, 0.94);
}

.internal-ai-review-modal__rows-head,
.internal-ai-review-modal__rows-item {
  display: grid;
  grid-template-columns:
    minmax(220px, 2fr)
    minmax(128px, 1fr)
    minmax(96px, 0.8fr)
    minmax(88px, 0.7fr)
    minmax(128px, 1fr)
    minmax(128px, 1fr);
  gap: 10px;
  align-items: start;
}

.internal-ai-review-modal__rows-head {
  padding: 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b6c3d;
}

.internal-ai-review-modal__rows-item {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.1);
  background: rgba(255, 255, 255, 0.92);
}

.internal-ai-review-modal__rows-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.internal-ai-review-modal__rows-item strong,
.internal-ai-review-modal__rows-cell span {
  color: #2f2618;
  line-height: 1.45;
  word-break: break-word;
}

.internal-ai-review-modal__rows-cell::before {
  display: none;
  content: attr(data-label);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #8b6c3d;
}

.internal-ai-review-modal__rows-item.is-positive {
  border-color: rgba(92, 122, 82, 0.24);
  background: rgba(237, 247, 233, 0.94);
}

.internal-ai-review-modal__rows-item.is-warning {
  border-color: rgba(176, 126, 27, 0.24);
  background: rgba(255, 247, 230, 0.94);
}

.internal-ai-review-modal__proposal-card,
.internal-ai-review-modal__execution-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(249, 244, 236, 0.9);
}

.internal-ai-review-modal__proposal-list {
  display: grid;
  gap: 10px;
}

.internal-ai-review-modal__proposal-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.92);
}

.internal-ai-review-modal__proposal-item strong {
  color: #2f2618;
  line-height: 1.5;
}

.internal-ai-review-modal__decision-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.internal-ai-review-modal__decision-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
  min-height: 150px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.96);
  color: #2f2618;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

.internal-ai-review-modal__decision-card strong {
  font-size: 15px;
  line-height: 1.35;
}

.internal-ai-review-modal__decision-card p {
  margin: 0;
  line-height: 1.5;
  color: #5d4d35;
}

.internal-ai-review-modal__decision-card:hover:not(:disabled),
.internal-ai-review-modal__decision-card:focus-visible:not(:disabled) {
  border-color: rgba(92, 122, 82, 0.24);
  box-shadow: 0 12px 24px rgba(52, 71, 40, 0.12);
  transform: translateY(-1px);
}

.internal-ai-review-modal__decision-card.is-suggested {
  border-color: rgba(110, 85, 51, 0.2);
  background: rgba(255, 250, 241, 0.98);
}

.internal-ai-review-modal__decision-card.is-selected {
  border-color: rgba(92, 122, 82, 0.3);
  background: rgba(237, 247, 233, 0.98);
}

.internal-ai-review-modal__decision-card:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.internal-ai-review-modal__decision-note {
  font-size: 12px;
  line-height: 1.45;
  color: #8b6c3d;
}

.internal-ai-review-modal__details {
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(252, 249, 244, 0.92);
}

.internal-ai-review-modal__details summary {
  cursor: pointer;
  padding: 14px 16px;
  font-weight: 700;
  color: #2f2618;
}

.internal-ai-review-modal__details-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px 16px;
}

.internal-ai-review-modal__technical-evidence {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.92);
}

.internal-ai-review-modal__technical-evidence strong {
  color: #2f2618;
}

.internal-ai-review-modal__technical-evidence pre {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #3d3123;
}

.internal-ai-document-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.internal-ai-document-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(28, 21, 11, 0.56);
  cursor: pointer;
}

.internal-ai-document-modal__sheet {
  position: relative;
  z-index: 1;
  width: min(1100px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 22px;
  border-radius: 24px;
  background: #f8f3ea;
  box-shadow: 0 24px 80px rgba(27, 19, 7, 0.22);
}

.internal-ai-document-modal__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.internal-ai-document-modal__content {
  padding: 18px;
  border-radius: 22px;
  background: #fffdfa;
  border: 1px solid rgba(110, 85, 51, 0.12);
}

.internal-ai-document-modal__pdf-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.internal-ai-document-modal__pdf-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.internal-ai-document-modal__pdf-viewer {
  width: 100%;
  min-height: 72vh;
  border: 1px solid rgba(110, 85, 51, 0.12);
  border-radius: 18px;
  background: #f2ede4;
}

.internal-ai-document-modal__details {
  border-top: 1px solid rgba(110, 85, 51, 0.12);
  padding-top: 14px;
}

.internal-ai-document-modal__details summary {
  cursor: pointer;
  font-weight: 800;
  color: #4d412e;
}

.internal-ai-document-modal__details-content {
  margin-top: 14px;
}

.internal-ai-operational-report {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.internal-ai-operational-report__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.internal-ai-operational-report__brand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.internal-ai-operational-report__logo {
  width: 68px;
  height: 68px;
  object-fit: contain;
  padding: 10px;
  border-radius: 18px;
  background: #fffdfa;
  border: 1px solid rgba(110, 85, 51, 0.12);
}

.internal-ai-operational-report__summary-card {
  background:
    linear-gradient(135deg, rgba(248, 243, 234, 0.96), rgba(255, 255, 255, 0.98)),
    #fff;
}

.internal-ai-operational-report__summary-list {
  margin-top: 0;
}

.internal-ai-operational-report__media-stack {
  display: grid;
  gap: 14px;
}

.internal-ai-operational-report__media-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
  border-radius: 22px;
  border: 1px solid rgba(110, 85, 51, 0.14);
  background: linear-gradient(180deg, rgba(255, 250, 244, 0.96), rgba(255, 255, 255, 0.98));
  box-shadow: 0 16px 28px rgba(47, 38, 24, 0.06);
}

.internal-ai-operational-report__media-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}

.internal-ai-operational-report__media-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: minmax(0, 1.35fr) minmax(240px, 320px);
  align-items: start;
}

.internal-ai-operational-report__photo-shell {
  min-height: 220px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: #f4ede2;
}

.internal-ai-operational-report__media-copy {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.internal-ai-operational-report__media-copy h3 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
  color: #2f2618;
}

.internal-ai-operational-report__identity-line {
  margin: 0;
  color: #6b5c45;
  font-size: 15px;
  line-height: 1.6;
}

.internal-ai-operational-report__photo {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 220px;
  object-fit: cover;
  background: #f4ede2;
}

.internal-ai-operational-report__photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 18px;
  color: #6b5c45;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 12px;
  font-weight: 700;
}

.internal-ai-operational-report__kv-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.internal-ai-operational-report__kv-grid strong {
  display: block;
  color: #2f2618;
}

.internal-ai-operational-report__kv-label {
  display: block;
  margin-bottom: 4px;
  color: #6b5c45;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.internal-ai-operational-report__tyre-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.internal-ai-operational-report__tyre-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 1.2fr) minmax(220px, 1fr);
  align-items: flex-start;
}

.internal-ai-operational-report__tyre-visual .mg-truck-svg {
  width: 100%;
  height: auto;
  display: block;
}

.internal-ai-operational-report__tyre-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.internal-ai-operational-report__sections {
  display: grid;
  gap: 14px;
}

.internal-ai-operational-report__section-card {
  border-radius: 22px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 246, 240, 0.9));
}

.internal-ai-operational-report__section-card .next-panel__header h2 {
  font-size: 18px;
  line-height: 1.2;
}

.internal-ai-operational-report__section-summary {
  margin-top: 0;
  margin-bottom: 12px;
  color: #4d412e;
  font-size: 15px;
  line-height: 1.7;
}

.internal-ai-operational-report__appendix {
  display: grid;
  gap: 14px;
}

.internal-ai-search {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.internal-ai-search--combined {
  border: 1px solid rgba(92, 122, 82, 0.18);
  background:
    linear-gradient(135deg, rgba(244, 248, 239, 0.96), rgba(255, 255, 255, 0.98)),
    #fff;
}

.internal-ai-search__status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.internal-ai-search__form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
}

.internal-ai-search__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #4d412e;
  font-weight: 700;
}

.internal-ai-search__input {
  width: 100%;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(110, 85, 51, 0.18);
  background: #fffdf9;
  color: #2f2618;
  font-size: 15px;
}

.internal-ai-search__input:focus {
  outline: 2px solid rgba(92, 122, 82, 0.24);
  border-color: rgba(92, 122, 82, 0.46);
}

.internal-ai-search__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.internal-ai-search__button {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #2f2618;
  color: #fff8ee;
  font-weight: 800;
  cursor: pointer;
}

.internal-ai-search__button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.internal-ai-suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.internal-ai-suggestion {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.95);
  color: #2f2618;
  text-align: left;
  cursor: pointer;
}

.internal-ai-suggestion.is-selected {
  border-color: rgba(92, 122, 82, 0.46);
  background: #f4f8ef;
}

.internal-ai-suggestion__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.internal-ai-chat__aside-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.internal-ai-chat__aside-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.internal-ai-chat__aside-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.internal-ai-chat__aside-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: #faf7f1;
  color: #2f2618;
  text-align: left;
  cursor: pointer;
}

.internal-ai-chat__aside-item strong {
  font-size: 14px;
}

.internal-ai-chat__aside-item span {
  font-size: 12px;
  color: #6b5c45;
}

.internal-ai-secondary-panel__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.internal-ai-overview-advanced summary {
  cursor: pointer;
  font-weight: 700;
  color: #5d4d35;
}

.internal-ai-chat__secondary,
.internal-ai-overview-advanced {
  display: none;
}

.internal-ai-list__row {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(110, 85, 51, 0.12);
}

.internal-ai-list__row-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.internal-ai-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.internal-ai-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #ece5d6;
  color: #5a4934;
  font-size: 12px;
  font-weight: 700;
}

.internal-ai-pill.is-warning {
  background: #fdecc9;
  color: #8a5a05;
}

.internal-ai-pill.is-positive {
  background: #e8f3df;
  color: #2e5b22;
}

.internal-ai-pill.is-danger {
  background: #f9d5d5;
  color: #8e2e2e;
}

.internal-ai-pill.is-neutral {
  background: #ece5d6;
  color: #5a4934;
}

.internal-ai-inline-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #4d412e;
}

.internal-ai-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.internal-ai-muted {
  color: #6b5c45;
}

.internal-ai-button-row .internal-ai-search__button {
  min-width: 190px;
}

.internal-ai-empty {
  margin: 0;
  max-width: none;
  padding: 18px;
}

.internal-ai-runtime-observer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.internal-ai-runtime-observer-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: rgba(255, 255, 255, 0.94);
}

.internal-ai-runtime-observer-card__media-link {
  display: block;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: #f3ede4;
}

.internal-ai-runtime-observer-card__media {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  background: #f3ede4;
}

.internal-ai-runtime-observer-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 16px;
  border-radius: 14px;
  border: 1px dashed rgba(110, 85, 51, 0.2);
  background: #faf6ef;
  color: #6b5c45;
  text-align: center;
}

.internal-ai-runtime-observer-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.internal-ai-runtime-observer-state {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(110, 85, 51, 0.12);
  background: #faf6ef;
}

@media (max-width: 900px) {
  .internal-ai-hero {
    grid-template-columns: 1fr;
  }

  .internal-ai-archive__toolbar {
    grid-template-columns: 1fr;
  }

  .internal-ai-search__form {
    grid-template-columns: 1fr;
  }

  .internal-ai-chat__shell {
    grid-template-columns: 1fr;
  }

  .internal-ai-chat__toolbar,
  .internal-ai-chat__composer-grid {
    grid-template-columns: 1fr;
  }

  .internal-ai-chat__aside {
    position: static;
  }

  .internal-ai-chat__composer {
    padding: 16px;
  }

  .internal-ai-chat__composer-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .internal-ai-home-modal {
    padding: 12px;
  }

  .internal-ai-home-modal__lead {
    flex-direction: column;
  }

  .internal-ai-chat__document-proposal-shell,
  .internal-ai-chat__document-proposal-shell.is-home-modal {
    max-height: min(52vh, 460px);
  }

  .internal-ai-chat__document-dossier-header,
  .internal-ai-chat__document-dossier-body,
  .internal-ai-chat__document-dossier-interpretation-grid,
  .internal-ai-chat__document-dossier-data-grid,
  .internal-ai-chat__document-dossier-meta-grid,
  .internal-ai-chat__document-dossier-inline-result-grid {
    grid-template-columns: 1fr;
  }

  .internal-ai-chat__document-dossier-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .internal-ai-chat__document-dossier-items-head {
    display: none;
  }

  .internal-ai-chat__document-dossier-items-row {
    grid-template-columns: 1fr 1fr;
  }

  .internal-ai-chat__document-dossier-items-row strong {
    grid-column: 1 / -1;
  }

  .internal-ai-review-modal {
    padding: 10px;
  }

  .internal-ai-review-modal__sheet {
    height: calc(100vh - 20px);
    padding: 14px;
    border-radius: 22px;
  }

  .internal-ai-review-modal__content {
    grid-template-columns: 1fr;
  }

  .internal-ai-review-modal__preview-pane {
    min-height: 44vh;
  }

  .internal-ai-review-modal__facts-grid,
  .internal-ai-review-modal__facts-grid--summary,
  .internal-ai-review-modal__decision-grid {
    grid-template-columns: 1fr 1fr;
  }

  .internal-ai-review-modal__rows-head {
    display: none;
  }

  .internal-ai-review-modal__rows-item {
    grid-template-columns: 1fr 1fr;
  }

  .internal-ai-review-modal__rows-cell::before {
    display: block;
  }

  .internal-ai-review-modal__rows-cell:first-child {
    grid-column: 1 / -1;
  }

  .internal-ai-document-modal {
    padding: 12px;
  }

  .internal-ai-document-modal__sheet {
    max-height: calc(100vh - 24px);
    padding: 16px;
  }

  .internal-ai-document-modal__pdf-viewer {
    min-height: 60vh;
  }

  .internal-ai-operational-report__media-grid,
  .internal-ai-operational-report__tyre-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .internal-ai-chat__document-proposal-card {
    padding: 16px;
    border-radius: 18px;
  }

  .internal-ai-chat__document-proposal-title {
    font-size: 20px;
  }

  .internal-ai-chat__document-proposal-shell,
  .internal-ai-chat__document-proposal-shell.is-home-modal {
    min-height: 200px;
    max-height: min(58vh, 520px);
  }

  .internal-ai-review-modal {
    padding: 6px;
  }

  .internal-ai-review-modal__sheet {
    height: calc(100vh - 12px);
    padding: 12px;
    border-radius: 18px;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .internal-ai-review-modal__route-tabs {
    order: 2;
  }

  .internal-ai-review-modal__toolbar-main h2 {
    font-size: 24px;
  }

  .internal-ai-review-modal__preview-pane {
    min-height: 38vh;
  }

  .internal-ai-review-modal__facts-grid,
  .internal-ai-review-modal__facts-grid--summary,
  .internal-ai-review-modal__decision-grid,
  .internal-ai-review-modal__rows-item {
    grid-template-columns: 1fr;
  }

  .internal-ai-chat__document-dossier-summary-grid,
  .internal-ai-chat__document-dossier-inline-result-grid,
  .internal-ai-chat__document-dossier-items-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .internal-ai-unified-documents.is-review-active {
    height: auto;
  }

  .internal-ai-unified-documents__layout,
  .internal-ai-unified-documents__review-grid {
    grid-template-columns: 1fr;
  }

  .internal-ai-unified-documents__entry {
    position: static;
  }

  .internal-ai-unified-documents.is-review-active .internal-ai-unified-documents__entry {
    max-height: none;
    overflow: visible;
  }

  .internal-ai-unified-documents.is-review-active .internal-ai-unified-documents__tab-panel {
    flex: initial;
    overflow: visible;
  }
}

@media (max-width: 720px) {
  .internal-ai-unified-documents__hero,
  .internal-ai-unified-documents__route-note,
  .internal-ai-unified-documents__history-head,
  .internal-ai-unified-documents__history-item {
    flex-direction: column;
  }

  .internal-ai-unified-documents__row {
    grid-template-columns: 1fr;
  }

  .internal-ai-unified-documents__history-modal {
    padding: 8px;
  }

  .internal-ai-unified-documents__history-sheet,
  .internal-ai-unified-documents__entry,
  .internal-ai-unified-documents__tab-panel {
    padding: 16px;
    border-radius: 18px;
  }
}

/* 42B - Home launcher */

.next-home__ai-card {
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.next-home__ai-head {
  display: flex;
}

.next-home__ai-copy {
  display: block;
}

.next-home__ai-launcher {
  margin-top: 0;
}

.home-ia-launcher {
  display: grid;
  gap: 18px;
}

.home-ia-launcher__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.home-ia-launcher__panel {
  display: grid;
  gap: 16px;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 38px rgba(32, 37, 54, 0.08);
}

.home-ia-launcher__panel--archivista {
  background: linear-gradient(180deg, rgba(247, 252, 248, 0.96), rgba(255, 255, 255, 0.94));
}

.home-ia-launcher__section-head,
.home-ia-launcher__title-wrap,
.home-ia-launcher__composer-row,
.home-ia-launcher__panel-footer,
.home-ia-launcher__panel-actions,
.home-ia-launcher__subtools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.home-ia-launcher__title-wrap {
  align-items: flex-start;
}

.home-ia-launcher__eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #708094;
}

.home-ia-launcher__title {
  font-size: 20px;
  color: #202329;
}

.home-ia-launcher__intro {
  margin: 0;
  color: #586475;
  line-height: 1.55;
}

.home-ia-launcher__status-dot {
  width: 8px;
  height: 8px;
  margin-top: 8px;
  border-radius: 50%;
  background: #1d9e75;
  flex-shrink: 0;
}

.home-ia-launcher__status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 20px;
  background: #e1f5ee;
  color: #0f6e56;
  font-size: 13px;
  font-weight: 700;
}

.home-ia-launcher__status-pill.is-archivista {
  background: #edf7ee;
  color: #2e6a35;
}

.home-ia-launcher__composer {
  position: relative;
}

.home-ia-launcher__composer-row {
  align-items: stretch;
}

.home-ia-launcher__submit,
.home-ia-launcher__history-link,
.home-ia-launcher__quick-action,
.home-ia-launcher__secondary-chip {
  border-radius: 14px;
  cursor: pointer;
}

.home-ia-launcher__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid #1d9e75;
  background: #1d9e75;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
}

.home-ia-launcher__input {
  flex: 1;
  min-width: 0;
  min-height: 46px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  color: #1d222c;
  font-size: 15px;
}

.home-ia-launcher__quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.home-ia-launcher__quick-action {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 86px;
  padding: 14px;
  border: 1px solid rgba(31, 36, 45, 0.1);
  background: #ffffff;
  text-align: left;
}

.home-ia-launcher__quick-action:hover,
.home-ia-launcher__secondary-chip:hover,
.home-ia-launcher__history-link:hover {
  border-color: rgba(31, 36, 45, 0.24);
  transform: translateY(-1px);
}

.home-ia-launcher__quick-copy {
  display: grid;
  gap: 4px;
}

.home-ia-launcher__quick-copy strong {
  font-size: 14px;
  color: #1d222c;
}

.home-ia-launcher__quick-copy span,
.home-ia-launcher__footnote,
.home-ia-launcher__subtools-label {
  font-size: 12px;
  color: #6a7280;
}

.home-ia-launcher__history-link,
.home-ia-launcher__secondary-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  color: #1d222c;
  font-size: 14px;
  font-weight: 700;
}

.home-ia-launcher__panel-footer {
  align-items: flex-end;
}

.home-ia-launcher__panel-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.home-ia-launcher__subtools {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.internal-ai-report-split-callout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: linear-gradient(180deg, #f7fafc, #ffffff);
}

.internal-ai-report-split-callout h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #202329;
}

.internal-ai-report-split-callout__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.internal-ai-dispatcher__entry-note {
  display: grid;
  gap: 6px;
}

/* 42B - Dispatcher page */

.internal-ai-dispatcher {
  display: grid;
  gap: 18px;
  padding: 20px;
}

.internal-ai-dispatcher__header,
.internal-ai-dispatcher__header-main,
.internal-ai-dispatcher__title-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.internal-ai-dispatcher__title-wrap strong {
  font-size: 18px;
  color: #202329;
}

.internal-ai-dispatcher__shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 18px;
  align-items: start;
}

.internal-ai-dispatcher__main {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.internal-ai-dispatcher__document-entry {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr) auto;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.1);
  background: #faf8f3;
}

.internal-ai-dispatcher__upload {
  margin: 0;
}

.internal-ai-dispatcher__document-actions {
  display: grid;
  align-content: end;
  gap: 8px;
}

.internal-ai-dispatcher__messages {
  min-height: 360px;
  max-height: 520px;
}

.internal-ai-dispatcher__aside {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 12px;
}

.internal-ai-dispatcher__functions {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
}

.internal-ai-dispatcher__module {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(31, 36, 45, 0.08);
}

.internal-ai-dispatcher__module:last-child {
  border-bottom: 0;
}

.internal-ai-dispatcher__module-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.internal-ai-dispatcher__module-copy {
  display: grid;
  gap: 2px;
}

.internal-ai-dispatcher__module-copy strong {
  font-size: 13px;
  color: #202329;
}

.internal-ai-dispatcher__module-copy span {
  font-size: 11px;
  color: #6a7280;
}

.internal-ai-dispatcher__module-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.internal-ai-dispatcher__module-status.is-in-use {
  background: #e1f5ee;
  color: #0f6e56;
}

.internal-ai-dispatcher__module-status.is-active {
  background: #eef1f4;
  color: #516072;
}

.internal-ai-dispatcher__history-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 0;
  border-radius: 14px;
  background: #f4efe6;
  color: #202329;
  font-weight: 700;
  cursor: pointer;
}

.internal-ai-dispatcher__composer {
  padding-top: 8px;
}

.internal-ai-dispatcher__composer-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.internal-ai-chat__dispatcher-banner {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(29, 158, 117, 0.16);
  border-left: 3px solid #1d9e75;
  background: #f6faf8;
}

.internal-ai-chat__dispatcher-banner.is-warning {
  border-left-color: #854f0b;
  background: #fdf7eb;
}

.internal-ai-chat__dispatcher-banner-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.internal-ai-chat__dispatcher-banner-file {
  font-size: 15px;
  font-weight: 600;
  color: #202329;
}

.internal-ai-chat__dispatcher-banner-actions {
  justify-content: flex-start;
}

/* 42B - Review shell */

.internal-ai-unified-documents__review-shell {
  display: grid;
  gap: 16px;
}

.internal-ai-unified-documents__review-toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
}

.internal-ai-unified-documents__review-title {
  font-size: 18px;
  color: #202329;
}

.internal-ai-unified-documents__review-split {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 500px;
}

.internal-ai-unified-documents__review-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.internal-ai-unified-documents__review-field {
  display: grid;
  gap: 6px;
}

.internal-ai-unified-documents__review-field span {
  font-size: 12px;
  font-weight: 700;
  color: #4d5b6b;
}

.internal-ai-unified-documents__review-field input,
.internal-ai-unified-documents__review-field select {
  min-height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #5dcaa5;
  background: #e1f5ee;
  color: #202329;
}

.internal-ai-unified-documents__review-field input:disabled,
.internal-ai-unified-documents__review-field select:disabled {
  opacity: 0.9;
}

.internal-ai-unified-documents__review-col-left {
  border-right: 0.5px solid rgba(110, 85, 51, 0.12);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 500px;
}

.internal-ai-unified-documents__review-col-right {
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.internal-ai-unified-documents__dest-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 18px;
  border-bottom: 0.5px solid rgba(110, 85, 51, 0.12);
  background: #faf6ef;
  flex-wrap: wrap;
}

.internal-ai-unified-documents__dest-bar-label {
  font-size: 11px;
  color: #8b6c3d;
  white-space: nowrap;
}

.internal-ai-unified-documents__dest-bar-select {
  font-size: 12px;
  padding: 5px 8px;
  border: 0.5px solid #5dcaa5;
  border-radius: 12px;
  background: #e1f5ee;
  color: #202329;
  flex: 1;
  max-width: 260px;
}

.internal-ai-unified-documents__dest-bar-count {
  font-size: 11px;
  padding: 3px 10px;
  background: #e1f5ee;
  color: #0f6e56;
  border-radius: 20px;
  white-space: nowrap;
}

.internal-ai-unified-documents__dest-bar-btn {
  font-size: 12px;
  font-weight: 500;
  padding: 6px 14px;
  background: #1d9e75;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.internal-ai-unified-documents__dest-bar-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.internal-ai-unified-documents__rows-col-header {
  display: grid;
  grid-template-columns: 18px 1fr 60px 70px 70px 90px;
  gap: 8px;
  padding: 4px 0 6px;
  border-bottom: 0.5px solid rgba(110, 85, 51, 0.12);
  font-size: 10px;
  font-weight: 500;
  color: #8b6c3d;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* 42B - Official history */

.internal-ai-history-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.internal-ai-history-page__shell {
  display: grid;
  gap: 18px;
}

.internal-ai-history-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
}

.internal-ai-history-page__header h1,
.internal-ai-history-page__section-head p {
  margin: 0;
}

.internal-ai-history-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.internal-ai-history-page__filter {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  color: #202329;
  font-weight: 700;
  cursor: pointer;
}

.internal-ai-history-page__filter.is-active {
  background: #1d9e75;
  border-color: #1d9e75;
  color: #ffffff;
}

.internal-ai-history-page__note,
.internal-ai-history-page__section {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
}

.internal-ai-history-page__section-head {
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(31, 36, 45, 0.08);
}

.internal-ai-history-page__section-head p {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6a7280;
}

.internal-ai-history-page__table {
  display: grid;
  gap: 12px;
}

.internal-ai-history-page__row {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(220px, 0.9fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(31, 36, 45, 0.08);
}

.internal-ai-history-page__row:last-child {
  border-bottom: 0;
}

.internal-ai-history-page__type {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.internal-ai-history-page__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.internal-ai-history-page__badge.is-fattura {
  background: #e6f1fb;
  color: #185fa5;
}

.internal-ai-history-page__badge.is-preventivo {
  background: #fbeaf0;
  color: #993556;
}

.internal-ai-history-page__badge.is-magazzino {
  background: #eaf3de;
  color: #3b6d11;
}

.internal-ai-history-page__badge.is-documento {
  background: #eef1f4;
  color: #516072;
}

.internal-ai-history-page__row-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  font-size: 13px;
  color: #516072;
}

.internal-ai-history-page__row-meta .is-warning {
  color: #854f0b;
  font-weight: 700;
}

.internal-ai-history-page__row-meta .is-positive {
  color: #0f6e56;
  font-weight: 700;
}

.internal-ai-history-page__row-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.internal-ai-history-page__empty,
.internal-ai-history-page__error {
  padding: 18px 20px;
  border-radius: 20px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
}

.internal-ai-history-page__error {
  color: #993556;
}

@media (max-width: 1100px) {
  .internal-ai-dispatcher__shell,
  .internal-ai-unified-documents__review-split,
  .internal-ai-history-page__row {
    grid-template-columns: 1fr;
  }

  .internal-ai-dispatcher__aside {
    position: static;
  }

  .internal-ai-dispatcher__document-entry,
  .internal-ai-unified-documents__review-form,
  .internal-ai-history-page__row-meta {
    grid-template-columns: 1fr;
  }
}

.ia-archivista-page {
  gap: 18px;
}

.ia-archivista__hero,
.ia-archivista__panel {
  display: grid;
  gap: 16px;
}

.ia-archivista__hero-actions,
.ia-archivista__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ia-archivista__hero-actions {
  flex-wrap: wrap;
}

.ia-archivista__meta-grid,
.ia-archivista__layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.ia-archivista__meta-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.ia-archivista__meta-card {
  min-height: 100%;
}

.ia-archivista__flow-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.ia-archivista__flow-badge.is-active {
  background: #edf7ee;
  color: #2e6a35;
}

.ia-archivista__flow-badge.is-coming {
  background: #eef4ff;
  color: #34588c;
}

.ia-archivista__flow-badge.is-out-of-scope {
  background: #f6ece1;
  color: #845024;
}

.ia-archivista__flow-badge.is-disabled {
  background: #f4efe8;
  color: #7a5e37;
}

.ia-archivista__option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.ia-archivista__option {
  display: grid;
  gap: 4px;
  min-height: 88px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.ia-archivista__option strong {
  font-size: 15px;
  color: #202329;
}

.ia-archivista__option span {
  font-size: 13px;
  color: #697587;
  line-height: 1.45;
}

.ia-archivista__option.is-active {
  border-color: rgba(29, 158, 117, 0.42);
  background: rgba(232, 247, 240, 0.86);
}

.ia-archivista__option.is-disabled {
  opacity: 0.56;
  cursor: not-allowed;
}

.ia-archivista__upload {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  border: 1px dashed rgba(31, 36, 45, 0.22);
  background: #fbfcfd;
  cursor: pointer;
}

.ia-archivista__upload input {
  display: block;
}

.ia-archivista__file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ia-archivista__file-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eef3f8;
  color: #304154;
  font-size: 13px;
  font-weight: 700;
}

.ia-archivista__flow-summary {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: #f8fafb;
}

.ia-archivista__flow-summary h3,
.ia-archivista__flow-summary p {
  margin: 0;
}

.ia-archivista__flow-summary h3 {
  font-size: 18px;
  color: #202329;
}

.ia-archivista__flow-summary p {
  color: #5c6878;
  line-height: 1.55;
}

.ia-archivista__analyze-button {
  justify-self: start;
}

.ia-archivista__notice {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(184, 141, 54, 0.24);
  background: #fff6e1;
  color: #6f5716;
  font-weight: 600;
  line-height: 1.5;
}

.ia-archivista__inactive-shell,
.ia-archivista-bridge {
  display: grid;
  gap: 16px;
}

.ia-archivista__inactive-shell {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: #f8fafb;
}

.ia-archivista__inactive-shell h3,
.ia-archivista__inactive-shell p {
  margin: 0;
}

.ia-archivista__inactive-shell.is-coming {
  border-color: rgba(67, 113, 179, 0.2);
  background: linear-gradient(180deg, #f2f7ff, #ffffff);
}

.ia-archivista__inactive-shell.is-out-of-scope {
  border-color: rgba(132, 80, 36, 0.16);
  background: linear-gradient(180deg, #fbf3ea, #ffffff);
}

.ia-archivista-bridge__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: linear-gradient(180deg, #f5fbf7, #ffffff);
}

.ia-archivista-bridge__intro-copy {
  display: grid;
  gap: 8px;
}

.ia-archivista-bridge__intro-copy h3,
.ia-archivista-bridge__intro-copy p {
  margin: 0;
}

.ia-archivista-bridge__upload {
  background: linear-gradient(180deg, #fbfcfd, #ffffff);
}

.ia-archivista-bridge__segmented {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.ia-archivista-bridge__segment,
.ia-archivista-bridge__choice,
.ia-archivista-bridge__ghost-button {
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  color: #202329;
  cursor: pointer;
}

.ia-archivista-bridge__segment {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 16px;
  text-align: left;
}

.ia-archivista-bridge__segment strong {
  font-size: 14px;
}

.ia-archivista-bridge__segment span {
  font-size: 13px;
  color: #5c6878;
  line-height: 1.45;
}

.ia-archivista-bridge__segment.is-active,
.ia-archivista-bridge__choice.is-active,
.ia-archivista-bridge__row.is-selected {
  border-color: rgba(29, 158, 117, 0.36);
  background: #f2fbf6;
}

.ia-archivista-bridge__file-meta,
.ia-archivista-bridge__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.ia-archivista-bridge__file-hint {
  color: #5c6878;
  font-size: 13px;
  font-weight: 600;
}

.ia-archivista-bridge__actions .internal-ai-card__meta {
  margin: 0;
}

.ia-archivista-bridge__review-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.ia-archivista-bridge__archive-grid,
.ia-archivista-bridge__choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.ia-archivista-bridge__review-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
}

.ia-archivista-bridge__rows-card {
  display: grid;
  gap: 14px;
}

.ia-archivista-bridge__review-head {
  display: grid;
  gap: 6px;
}

.ia-archivista-bridge__image-preview,
.ia-archivista-bridge__preview-placeholder {
  width: 100%;
  min-height: 250px;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: #f8fafb;
}

.ia-archivista-bridge__image-preview {
  object-fit: contain;
}

.ia-archivista-bridge__preview-placeholder {
  display: grid;
  place-items: center;
  padding: 24px;
  color: #5c6878;
  text-align: center;
  line-height: 1.55;
}

.ia-archivista-bridge__status-box,
.ia-archivista-bridge__summary,
.ia-archivista-bridge__warnings {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafb;
}

.ia-archivista-bridge__status-box p,
.ia-archivista-bridge__summary p,
.ia-archivista-bridge__warnings p {
  margin: 0;
}

.ia-archivista-bridge__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.ia-archivista-bridge__facts div {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafb;
}

.ia-archivista-bridge__facts div.is-missing {
  border: 1px dashed rgba(184, 141, 54, 0.34);
  background: #fff8eb;
}

.ia-archivista-bridge__facts dt {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7a5e37;
}

.ia-archivista-bridge__facts dd {
  margin: 0;
  color: #202329;
  font-weight: 700;
}

.ia-archivista-bridge__rows {
  display: grid;
  gap: 10px;
}

.ia-archivista-bridge__row {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafb;
}

.ia-archivista-bridge__ghost-button {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.ia-archivista-bridge__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.ia-archivista-bridge__row strong {
  color: #202329;
}

.ia-archivista-bridge__row-note {
  margin: 0;
  color: #5c6878;
  font-size: 13px;
}

.ia-archivista-bridge__row-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  color: #5c6878;
  font-size: 13px;
}

.ia-archivista-bridge__tone-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.ia-archivista-bridge__tone-pill.is-materiali {
  background: #eff7ff;
  color: #315d8c;
}

.ia-archivista-bridge__tone-pill.is-manodopera {
  background: #edf7ee;
  color: #2d6e38;
}

.ia-archivista-bridge__tone-pill.is-ricambi {
  background: #fff3ea;
  color: #8a4e1f;
}

.ia-archivista-bridge__tone-pill.is-altro {
  background: #f4efe8;
  color: #70593d;
}

.ia-archivista-bridge__empty {
  display: grid;
  gap: 6px;
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(31, 36, 45, 0.16);
  background: #fbfcfd;
}

.ia-archivista-bridge__empty-title,
.ia-archivista-bridge__empty-copy {
  margin: 0;
}

.ia-archivista-bridge__empty-title {
  color: #202329;
  font-weight: 700;
}

.ia-archivista-bridge__empty-copy {
  color: #5c6878;
  line-height: 1.5;
}

.ia-archivista-bridge__warning-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: #6f5716;
}

.ia-archivista-bridge__warning-empty {
  color: #5c6878;
}

.ia-archivista-bridge__field {
  display: grid;
  gap: 8px;
}

.ia-archivista-bridge__field span {
  font-size: 13px;
  font-weight: 700;
  color: #5c6878;
}

.ia-archivista-bridge__field select {
  min-height: 42px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(31, 36, 45, 0.14);
  background: #ffffff;
  color: #202329;
}

.ia-archivista-bridge__inline-choice {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ia-archivista-bridge__inline-choice label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #4e5968;
}

.ia-archivista-bridge__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ia-archivista-bridge__mini-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef3f8;
  color: #304154;
  font-size: 12px;
  font-weight: 700;
}

.ia-archivista-bridge__list-box,
.ia-archivista-bridge__callout,
.ia-archivista-bridge__next-action {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafb;
}

.ia-archivista-bridge__callout-stack,
.ia-archivista-bridge__next-actions {
  display: grid;
  gap: 10px;
}

.ia-archivista-bridge__callout strong,
.ia-archivista-bridge__next-action strong {
  color: #202329;
}

.ia-archivista-bridge__callout p,
.ia-archivista-bridge__next-action span,
.ia-archivista-bridge__list-box p {
  margin: 0;
}

.ia-archivista-bridge__callout.is-highlight {
  border: 1px solid rgba(31, 158, 117, 0.24);
  background: #f3fbf6;
}

.ia-archivista-bridge__callout.is-warning {
  border: 1px solid rgba(184, 141, 54, 0.24);
  background: #fff6e1;
}

.ia-archivista-bridge__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: #4e5968;
}

@media (max-width: 720px) {
  .home-ia-launcher__panel,
  .internal-ai-dispatcher,
  .internal-ai-history-page__header,
  .internal-ai-history-page__note,
  .internal-ai-history-page__section,
  .internal-ai-unified-documents__review-toolbar {
    padding: 16px;
  }

  .home-ia-launcher__split,
  .internal-ai-dispatcher__composer-row,
  .internal-ai-unified-documents__review-toolbar {
    grid-template-columns: 1fr;
  }

  .internal-ai-report-split-callout,
  .ia-archivista__meta-grid,
  .ia-archivista__layout {
    grid-template-columns: 1fr;
  }

  .home-ia-launcher__composer-row,
  .home-ia-launcher__panel-footer,
  .home-ia-launcher__panel-actions,
  .home-ia-launcher__section-head,
  .ia-archivista__hero-actions,
  .ia-archivista__panel-head,
  .internal-ai-report-split-callout__actions,
  .ia-archivista-bridge__intro,
  .ia-archivista-bridge__actions,
  .ia-archivista-bridge__file-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .home-ia-launcher__submit,
  .home-ia-launcher__history-link,
  .home-ia-launcher__secondary-chip,
  .ia-archivista__analyze-button {
    width: 100%;
  }

  .ia-archivista-bridge__review-grid,
  .ia-archivista-bridge__archive-grid,
  .ia-archivista-bridge__choice-grid,
  .ia-archivista-bridge__facts,
  .ia-archivista-bridge__row-meta {
    grid-template-columns: 1fr;
  }
}

/* Override layout approvato - Importa documenti */

.ia-archivista-page {
  gap: 18px;
}

.ia-archivista__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.ia-archivista__hero-copy {
  display: grid;
  gap: 6px;
  max-width: 840px;
}

.ia-archivista__hero h1,
.ia-archivista__control-card h2,
.ia-archivista__upload-shell h3,
.ia-archivista__inactive-shell h3 {
  margin: 0;
  color: #202329;
}

.ia-archivista__hero .next-page__description {
  margin: 0;
  max-width: 840px;
}

.ia-archivista__hero-actions {
  justify-content: flex-end;
}

.ia-archivista__meta-grid,
.ia-archivista__layout,
.ia-archivista__flow-summary {
  display: none;
}

.ia-archivista__workspace {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.ia-archivista__control-card,
.ia-archivista__upload-shell,
.ia-archivista__inactive-shell,
.ia-archivista-bridge__preview-card,
.ia-archivista-bridge__detail-card,
.ia-archivista-bridge__rows-shell {
  border-radius: 24px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  box-shadow: 0 14px 36px rgba(31, 36, 45, 0.05);
  background: #ffffff;
}

.ia-archivista__control-card {
  display: grid;
  gap: 14px;
  min-height: 100%;
  padding: 18px;
}

.ia-archivista__bridge-host,
.ia-archivista-bridge {
  display: contents;
}

.ia-archivista__upload-shell,
.ia-archivista__inactive-shell,
.ia-archivista-bridge__intro,
.ia-archivista-bridge__segmented,
.ia-archivista-bridge__upload,
.ia-archivista-bridge__upload-footer,
.ia-archivista-bridge__file-meta,
.ia-archivista-bridge__actions {
  grid-column: 3;
}

.ia-archivista__upload-shell,
.ia-archivista__inactive-shell {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.ia-archivista__upload-shell-head,
.ia-archivista-bridge__upload-shell-head,
.ia-archivista-bridge__intro,
.ia-archivista__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ia-archivista__upload-shell-copy,
.ia-archivista__inactive-shell p {
  margin: 0;
  color: #5c6878;
  line-height: 1.55;
}

.ia-archivista__option-grid {
  grid-template-columns: 1fr;
}

.ia-archivista__option {
  min-height: 78px;
  padding: 14px 16px;
}

.ia-archivista__option span {
  margin-top: 4px;
}

.ia-archivista__upload {
  padding: 16px;
  border-radius: 18px;
}

.ia-archivista-bridge__upload-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ia-archivista-bridge__file-meta {
  min-width: 0;
}

.ia-archivista-bridge__actions {
  justify-content: flex-end;
}

.ia-archivista-bridge__main-shell,
.ia-archivista-bridge__review-grid {
  grid-column: 1 / -1;
}

.ia-archivista-bridge__main-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.9fr);
  gap: 16px;
  align-items: stretch;
}

.ia-archivista-bridge__review-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.9fr);
  gap: 16px;
}

.ia-archivista-bridge__review-grid > :first-child {
  min-width: 0;
}

.ia-archivista-bridge__review-grid > :nth-child(2),
.ia-archivista-bridge__review-grid > :nth-child(3) {
  min-width: 0;
}

.ia-archivista-bridge__review-grid > :nth-child(2),
.ia-archivista-bridge__review-grid > :nth-child(3),
.ia-archivista-bridge__details-stack {
  display: grid;
  gap: 16px;
}

.ia-archivista-bridge__preview-card,
.ia-archivista-bridge__detail-card,
.ia-archivista-bridge__rows-shell {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.ia-archivista-bridge__preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ia-archivista-bridge__preview-frame {
  min-height: 480px;
  overflow: auto;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: #f7f9fb;
  padding: 18px;
}

.ia-archivista-bridge__image-preview {
  min-height: 420px;
  transform-origin: top center;
}

.ia-archivista-bridge__preview-placeholder {
  min-height: 480px;
}

.ia-archivista-bridge__compact-select {
  min-height: 34px;
  min-width: 86px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  color: #202329;
  font-weight: 700;
}

.ia-archivista-bridge__rows-shell,
.ia-archivista-bridge__rows-card {
  grid-column: 1 / -1;
  padding: 18px;
  border-radius: 24px;
}

.ia-archivista-bridge__table-wrap {
  overflow: auto;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.08);
}

.ia-archivista-bridge__table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
}

.ia-archivista-bridge__table th,
.ia-archivista-bridge__table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(31, 36, 45, 0.08);
  text-align: left;
  font-size: 13px;
  color: #304154;
  white-space: nowrap;
}

.ia-archivista-bridge__table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f8fafb;
  color: #5c6878;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ia-archivista-bridge__table tr:last-child td {
  border-bottom: none;
}

.ia-archivista-bridge__table tr.is-muted {
  opacity: 0.5;
}

.ia-archivista-bridge__table-cell-main {
  display: grid;
  gap: 4px;
  min-width: 240px;
}

.ia-archivista-bridge__table-cell-main strong {
  color: #202329;
}

.ia-archivista-bridge__table-cell-main span {
  color: #697587;
  font-size: 12px;
}

.ia-archivista-bridge__table-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #304154;
}

.ia-archivista-bridge__final-shell,
.ia-archivista-bridge__archive-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.ia-archivista-bridge__final-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.ia-archivista-bridge__facts dd {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ia-archivista-bridge__segmented {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: #ffffff;
  box-shadow: 0 14px 36px rgba(31, 36, 45, 0.05);
}

.ia-archivista-bridge__segment {
  min-height: 72px;
}

.ia-archivista-bridge__field select {
  min-height: 46px;
}

.ia-archivista-bridge__inline-choice {
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafb;
}

.ia-archivista-bridge__callout-stack {
  gap: 12px;
}

.ia-archivista-bridge__step-card {
  grid-column: 1 / -1;
  display: grid;
  gap: 16px;
  padding: 22px;
  border-radius: 24px;
}

.ia-archivista-bridge__step-head,
.ia-archivista-bridge__step-title-wrap,
.ia-archivista-bridge__step-actions,
.ia-archivista-bridge__collapsible-head,
.ia-archivista-bridge__success-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ia-archivista-bridge__step-title-wrap {
  justify-content: flex-start;
}

.ia-archivista-bridge__step-number,
.ia-archivista-bridge__step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-weight: 800;
}

.ia-archivista-bridge__step-number {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1d9e75;
  color: #ffffff;
  font-size: 14px;
  box-shadow: 0 10px 22px rgba(29, 158, 117, 0.24);
}

.ia-archivista-bridge__step-title-copy {
  display: grid;
  gap: 4px;
}

.ia-archivista-bridge__step-title-copy p,
.ia-archivista-bridge__step-title {
  margin: 0;
}

.ia-archivista-bridge__step-title {
  font-size: 20px;
  line-height: 1.2;
  color: #202329;
}

.ia-archivista-bridge__step-badge {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(29, 158, 117, 0.12);
  color: #0f5f45;
  font-size: 12px;
}

.ia-archivista-bridge__step-badge.is-success {
  background: #e7f7ef;
  color: #157450;
}

.ia-archivista-bridge__thumb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 12px;
}

.ia-archivista-bridge__thumb-card {
  position: relative;
  display: grid;
  gap: 8px;
  min-height: 172px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
}

.ia-archivista-bridge__thumb-card.is-active {
  border-color: #1d9e75;
  box-shadow: 0 0 0 2px rgba(29, 158, 117, 0.12);
}

.ia-archivista-bridge__thumb-card--add {
  place-items: center;
  border-style: dashed;
  border-color: rgba(29, 158, 117, 0.45);
  background: rgba(29, 158, 117, 0.04);
  cursor: pointer;
  text-align: center;
  color: #0f5f45;
  font-weight: 700;
}

.ia-archivista-bridge__thumb-card--add input {
  display: none;
}

.ia-archivista-bridge__thumb-add-sign {
  font-size: 28px;
  line-height: 1;
}

.ia-archivista-bridge__thumb-main {
  display: grid;
  gap: 8px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.ia-archivista-bridge__thumb-badges {
  display: flex;
  justify-content: flex-start;
}

.ia-archivista-bridge__thumb-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eef4ff;
  color: #185fa5;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.ia-archivista-bridge__thumb-preview {
  width: 100%;
  height: 98px;
  border-radius: 14px;
  object-fit: cover;
  background: #f4f7fa;
}

.ia-archivista-bridge__thumb-preview--pdf {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f5f45;
  font-weight: 800;
}

.ia-archivista-bridge__thumb-name {
  display: block;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: #202329;
  word-break: break-word;
}

.ia-archivista-bridge__thumb-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  color: #5c6878;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.ia-archivista-bridge__step1-preview,
.ia-archivista-bridge__summary-box,
.ia-archivista-bridge__warnings-panel,
.ia-archivista-bridge__success-bar {
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: #f8fafb;
}

.ia-archivista-bridge__summary-box {
  background: #f4f8ef;
}

.ia-archivista-bridge__summary-box p {
  margin: 0;
  color: #2f2618;
  line-height: 1.55;
}

.ia-archivista-bridge__step1-preview {
  display: grid;
  gap: 12px;
}

.ia-archivista-bridge__step-primary {
  width: 100%;
  justify-content: center;
}

.ia-archivista-bridge__step-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.ia-archivista-bridge__step-facts div {
  display: grid;
  gap: 6px;
  min-height: 86px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(31, 36, 45, 0.08);
  background: #ffffff;
}

.ia-archivista-bridge__step-facts div.is-missing {
  background: #fff8ef;
  border-color: rgba(239, 159, 39, 0.26);
}

.ia-archivista-bridge__step-facts dt {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b6c3d;
}

.ia-archivista-bridge__step-facts dd {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #202329;
}

.ia-archivista-bridge__divider {
  height: 1px;
  background: rgba(31, 36, 45, 0.08);
}

.ia-archivista-bridge__collapsible {
  display: grid;
  gap: 12px;
}

.ia-archivista-bridge__collapsible-head {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #202329;
  font-size: 15px;
  font-weight: 700;
}

.ia-archivista-bridge__collapsible-meta {
  font-size: 12px;
  color: #697587;
  font-weight: 700;
}

.ia-archivista-bridge__warnings-panel {
  display: grid;
  gap: 12px;
}

.ia-archivista-bridge__step-actions {
  flex-wrap: wrap;
}

.ia-archivista-bridge__step-actions > .iai-btn-conferma,
.ia-archivista-bridge__step-actions > .iai-btn-analizza,
.ia-archivista-bridge__step-actions > .internal-ai-nav__link,
.ia-archivista-bridge__step-actions > .ia-archivista-bridge__ghost-button {
  min-height: 42px;
}

.ia-archivista-bridge__archive-line {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: #2f2618;
}

.ia-archivista-bridge__success-bar {
  background: #eef9f1;
  border-color: rgba(29, 158, 117, 0.24);
}

.ia-archivista-bridge__success-bar strong,
.ia-archivista-bridge__success-bar p {
  margin: 0;
}

.ia-archivista-bridge__success-bar p {
  margin-top: 4px;
  color: #4f5d53;
}

.ia-archivista-bridge__maintenance-form {
  display: grid;
  gap: 14px;
}

.ia-archivista-bridge__maintenance-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ia-archivista-bridge__field-block {
  display: grid;
  gap: 6px;
}

.ia-archivista-bridge__field-block span {
  font-size: 12px;
  font-weight: 700;
  color: #5c6878;
}

.ia-archivista-bridge__field-block--full {
  grid-column: 1 / -1;
}

@media (max-width: 1180px) {
  .ia-archivista__workspace {
    grid-template-columns: 1fr 1fr;
  }

  .ia-archivista__upload-shell,
  .ia-archivista__inactive-shell,
  .ia-archivista-bridge__intro,
  .ia-archivista-bridge__segmented,
  .ia-archivista-bridge__upload,
  .ia-archivista-bridge__upload-footer,
  .ia-archivista-bridge__file-meta,
  .ia-archivista-bridge__actions {
    grid-column: 1 / -1;
  }

  .ia-archivista-bridge__main-shell,
  .ia-archivista-bridge__review-grid,
  .ia-archivista-bridge__final-shell,
  .ia-archivista-bridge__archive-grid {
    grid-template-columns: 1fr;
  }

  .ia-archivista-bridge__step-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .ia-archivista__hero,
  .ia-archivista__hero-actions,
  .ia-archivista__upload-shell-head,
  .ia-archivista__panel-head,
  .ia-archivista-bridge__upload-footer,
  .ia-archivista-bridge__actions,
  .ia-archivista-bridge__final-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .ia-archivista__workspace {
    grid-template-columns: 1fr;
  }

  .ia-archivista-bridge__preview-frame,
  .ia-archivista-bridge__preview-placeholder {
    min-height: 320px;
  }

  .ia-archivista-bridge__step-card,
  .ia-archivista-bridge__summary-box,
  .ia-archivista-bridge__warnings-panel,
  .ia-archivista-bridge__success-bar {
    padding: 16px;
  }

  .ia-archivista-bridge__step-head,
  .ia-archivista-bridge__step-title-wrap,
  .ia-archivista-bridge__collapsible-head,
  .ia-archivista-bridge__success-bar,
  .ia-archivista-bridge__step-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .ia-archivista-bridge__thumb-grid,
  .ia-archivista-bridge__step-facts,
  .ia-archivista-bridge__maintenance-grid {
    grid-template-columns: 1fr;
  }
}

/* 44A - Documenti e costi */

.doc-costi-page {
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  border: 1px solid rgba(31, 36, 45, 0.12);
  background: #ffffff;
  overflow: hidden;
}

.doc-costi-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.1);
  background: #faf8f3;
  flex-wrap: wrap;
}

.doc-costi-title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #202329;
  flex: 1;
}

.doc-costi-stat {
  font-size: 12px;
  color: #6a7280;
}

.doc-costi-stat b {
  color: #202329;
  font-weight: 600;
}

.doc-costi-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.1);
  flex-wrap: wrap;
  background: #ffffff;
}

.doc-costi-filter {
  font-size: 11px;
  padding: 4px 12px;
  border: 0.5px solid rgba(31, 36, 45, 0.12);
  border-radius: 20px;
  background: transparent;
  color: #516072;
  cursor: pointer;
}

.doc-costi-filter.is-active {
  background: #1d9e75;
  color: #ffffff;
  border-color: #1d9e75;
}

.doc-costi-search {
  font-size: 12px;
  padding: 5px 10px;
  border: 0.5px solid rgba(31, 36, 45, 0.12);
  border-radius: 12px;
  background: #ffffff;
  color: #202329;
  outline: none;
  width: 220px;
  margin-left: auto;
}

.doc-costi-fornitore {
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.1);
}

.doc-costi-fornitore-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 20px;
  background: #faf8f3;
  cursor: pointer;
  border: 0;
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.08);
  text-align: left;
}

.doc-costi-fornitore-chevron {
  font-size: 10px;
  color: #6a7280;
  transition: transform 0.15s;
  display: inline-block;
}

.doc-costi-fornitore-chevron.is-open {
  transform: rotate(90deg);
}

.doc-costi-fornitore-name {
  font-size: 13px;
  font-weight: 600;
  color: #202329;
  flex: 1;
}

.doc-costi-fornitore-total {
  font-size: 12px;
  font-weight: 600;
  color: #202329;
}

.doc-costi-table {
  width: 100%;
  border-collapse: collapse;
}

.doc-costi-table th {
  font-size: 10px;
  font-weight: 600;
  color: #6a7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 8px 20px;
  text-align: left;
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.08);
  background: #faf8f3;
  white-space: nowrap;
}

.doc-costi-table th.is-right {
  text-align: right;
}

.doc-costi-table td {
  font-size: 12px;
  color: #202329;
  padding: 10px 20px;
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.08);
  vertical-align: middle;
}

.doc-costi-table tr:last-child td {
  border-bottom: none;
}

.doc-costi-table tbody tr:hover td {
  background: #faf8f3;
  cursor: pointer;
}

.doc-costi-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  font-weight: 700;
}

.doc-costi-badge.is-fattura {
  background: #e6f1fb;
  color: #185fa5;
}

.doc-costi-badge.is-preventivo {
  background: #fbeaf0;
  color: #993556;
}

.doc-costi-badge.is-ddt {
  background: #eaf3de;
  color: #3b6d11;
}

.doc-costi-targa {
  font-size: 11px;
  padding: 2px 7px;
  background: #faf8f3;
  border: 0.5px solid rgba(31, 36, 45, 0.12);
  border-radius: 4px;
  color: #516072;
  font-family: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.doc-costi-importo {
  font-size: 13px;
  font-weight: 600;
  color: #202329;
  text-align: right;
  white-space: nowrap;
}

.doc-costi-valuta {
  font-size: 10px;
  color: #6a7280;
  margin-left: 3px;
}

.doc-costi-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.doc-costi-btn,
.doc-costi-btn-ia {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  cursor: pointer;
}

.doc-costi-btn {
  border: 0.5px solid rgba(31, 36, 45, 0.12);
  background: transparent;
  color: #516072;
}

.doc-costi-btn:hover:not(:disabled) {
  border-color: #1d9e75;
  color: #0f6e56;
}

.doc-costi-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.doc-costi-btn-ia {
  border: none;
  background: #e1f5ee;
  color: #0f6e56;
}

.doc-costi-row-flag {
  display: inline-flex;
  margin-top: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #854f0b;
}

.doc-costi-section-total {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  align-items: center;
  padding: 8px 20px;
  background: #faf8f3;
  border-top: 0.5px solid rgba(31, 36, 45, 0.08);
}

.doc-costi-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 0.5px solid rgba(31, 36, 45, 0.08);
  background: #faf8f3;
  gap: 12px;
}

.doc-costi-modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.doc-costi-modal-overlay.is-open {
  display: flex;
}

.doc-costi-modal {
  background: #ffffff;
  border-radius: 20px;
  border: 0.5px solid rgba(31, 36, 45, 0.12);
  width: 540px;
  max-width: 95vw;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.doc-costi-modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.08);
  background: #faf8f3;
  flex-shrink: 0;
}

.doc-costi-modal-title {
  font-size: 14px;
  font-weight: 600;
  color: #202329;
  flex: 1;
}

.doc-costi-modal-close {
  font-size: 13px;
  padding: 4px 10px;
  border: 0.5px solid rgba(31, 36, 45, 0.12);
  border-radius: 12px;
  background: transparent;
  color: #516072;
  cursor: pointer;
}

.doc-costi-modal-body {
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.doc-costi-modal-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.doc-costi-modal-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.doc-costi-modal-field-label {
  font-size: 10px;
  color: #6a7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.doc-costi-modal-field-val {
  font-size: 13px;
  color: #202329;
  font-weight: 600;
}

.doc-costi-modal-head-only {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-costi-modal-righe-title {
  font-size: 11px;
  font-weight: 600;
  color: #6a7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 0.5px solid rgba(31, 36, 45, 0.08);
  padding-bottom: 6px;
}

.doc-costi-modal-empty {
  margin: 0;
  font-size: 12px;
  color: #516072;
  line-height: 1.5;
}

.doc-costi-modal-note {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #6a7280;
  line-height: 1.4;
}

.doc-costi-modal-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.doc-costi-modal-btn-primary,
.doc-costi-modal-btn-secondary,
.doc-costi-modal-btn-ia {
  font-size: 12px;
  padding: 7px 14px;
  border-radius: 12px;
  cursor: pointer;
}

.doc-costi-modal-btn-primary {
  font-weight: 600;
  background: #1d9e75;
  color: #ffffff;
  border: none;
}

.doc-costi-modal-btn-primary:disabled {
  opacity: 0.45;
  cursor: default;
}

.doc-costi-modal-btn-secondary {
  border: 0.5px solid rgba(31, 36, 45, 0.12);
  background: transparent;
  color: #516072;
}

.doc-costi-modal-btn-ia {
  background: #e1f5ee;
  color: #0f6e56;
  border: none;
  margin-left: auto;
}

.doc-costi-loading,
.doc-costi-empty {
  padding: 40px;
  text-align: center;
  font-size: 13px;
  color: #6a7280;
}

@media (max-width: 1100px) {
  .doc-costi-table {
    display: block;
    overflow-x: auto;
  }
}

@media (max-width: 720px) {
  .doc-costi-header,
  .doc-costi-filters,
  .doc-costi-fornitore-header,
  .doc-costi-section-total,
  .doc-costi-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .doc-costi-search {
    width: 100%;
    margin-left: 0;
  }

  .doc-costi-modal {
    width: 100%;
  }

  .doc-costi-modal-fields {
    grid-template-columns: 1fr;
  }

  .doc-costi-modal-btn-ia {
    margin-left: 0;
  }
}

/* 45 - Importa documenti layout approvato */
.iai-page *,
.iai-page *::before,
.iai-page *::after {
  box-sizing: border-box;
}

.iai-page {
  background: #f5f4f0;
  min-height: 100vh;
  padding-bottom: 3rem;
  font-family: "DM Sans", "Segoe UI", system-ui, sans-serif;
  color: #1a1a18;
}

.iai-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: #fff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}

.iai-topbar-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #888780;
}

.iai-btn-storico,
.iai-btn-cambia,
.iai-btn-scarta {
  font-size: 12px;
  padding: 5px 13px;
  border: 0.5px solid rgba(0, 0, 0, 0.22);
  border-radius: 6px;
  background: #fff;
  color: #5f5e5a;
  cursor: pointer;
  transition: background 0.12s;
  text-decoration: none;
}

.iai-btn-scarta,
.iai-btn-cambia,
.iai-btn-storico,
.iai-btn-analizza,
.iai-btn-duplicate,
.iai-viewer-btn,
.iai-btn-conferma,
.iai-toggle-btn {
  font-family: inherit;
}

.iai-btn-cambia:hover,
.iai-btn-storico:hover,
.iai-btn-scarta:hover {
  background: #f5f4f0;
}

.iai-hero {
  padding: 22px 24px 16px;
  background: #fff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}

.iai-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a18;
}

.iai-content {
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.iai-card {
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  padding: 16px 20px;
}

.iai-sec-label {
  margin: 0 0 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #888780;
}

.iai-dest-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.iai-dest-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0faf4;
  border: 1.5px solid #2d8a4e;
  border-radius: 8px;
  padding: 9px 16px;
}

.iai-dest-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2d8a4e;
  flex-shrink: 0;
}

.iai-dest-name,
.iai-dest-ctx {
  font-size: 14px;
  font-weight: 600;
  color: #1e6e3c;
}

.iai-dest-arrow {
  font-size: 13px;
  color: #2d8a4e;
  opacity: 0.7;
}

.iai-dest-control {
  position: relative;
}

.iai-dest-control summary {
  list-style: none;
}

.iai-dest-control summary::-webkit-details-marker {
  display: none;
}

.iai-dest-dropdown {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 240px;
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
  border-radius: 8px;
  z-index: 20;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.iai-dest-control[open] .iai-dest-dropdown,
.iai-dest-dropdown.is-open {
  display: block;
}

.iai-dd-sublabel {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #888780;
  padding: 8px 14px 4px;
}

.iai-dd-item {
  display: block;
  width: 100%;
  padding: 9px 14px;
  font-size: 13px;
  color: #1a1a18;
  background: #fff;
  border: 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}

.iai-dd-item:last-child {
  border-bottom: none;
}

.iai-dd-item:hover {
  background: #f5f4f0;
}

.iai-subtype-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.iai-subtype-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  background: #f0faf4;
  border: 1.5px solid #2d8a4e;
  border-radius: 8px;
  padding: 9px 18px;
}

.iai-subtype-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2d8a4e;
  flex-shrink: 0;
}

.iai-subtype-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e6e3c;
}

.iai-libretto-subtype-note {
  margin: 0;
  font-size: 11px;
  color: #3b6d11;
}

.iai-upload-hint {
  font-size: 11px;
  color: #888780;
}

.iai-upload-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.iai-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f4f0;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  color: #1a1a18;
}

.iai-doc-icon,
.iai-viewer-placeholder-icon {
  font-size: 12px;
  color: #5f5e5a;
}

.iai-chip-badge {
  font-size: 10px;
  background: #e6f1fb;
  color: #185fa5;
  border-radius: 4px;
  padding: 2px 7px;
  font-weight: 500;
}

.iai-btn-analizza {
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  background: #185fa5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
}

.iai-btn-analizza:hover {
  background: #0c447c;
}

.iai-btn-analizza:disabled {
  background: rgba(0, 0, 0, 0.15);
  color: #888780;
  cursor: not-allowed;
}

.iai-avvisi-banner {
  background: #faeeda;
  border: 0.5px solid #ef9f27;
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.iai-avviso-dot {
  width: 18px;
  height: 18px;
  border: 1.5px solid #854f0b;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #854f0b;
  flex-shrink: 0;
}

.iai-avviso-content {
  min-width: 0;
}

.iai-avviso-label {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #854f0b;
}

.iai-avviso-list {
  margin: 6px 0 0;
  padding-left: 16px;
  font-size: 12px;
  color: #633806;
  line-height: 1.5;
}

.iai-avviso-list li {
  margin: 0;
}

.iai-viewer {
  border-radius: 10px;
  overflow: hidden;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
}

.iai-viewer-toolbar {
  background: #2c2c2a;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
}

.iai-viewer-filename {
  color: #d3d1c7;
  margin-right: auto;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iai-viewer-btn {
  font-size: 10px;
  padding: 3px 9px;
  border: 0.5px solid #5f5e5a;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  color: #b4b2a9;
  transition: background 0.1s;
}

.iai-viewer-btn:hover {
  background: #444441;
}

.iai-viewer-body {
  background: #3a3a38;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.iai-viewer-img {
  width: 100%;
  max-width: 100%;
  max-height: 268px;
  border-radius: 3px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.3);
  object-fit: contain;
}

.iai-viewer-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #1a1a18;
  background: #fff;
  width: 100%;
  min-height: 268px;
  border-radius: 3px;
  justify-content: center;
}

.iai-viewer-placeholder-name {
  display: block;
  font-size: 12px;
}

.iai-libretto-card {
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  overflow: hidden;
}

.iai-libretto-header {
  background: #1a3a5c;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.iai-libretto-header p {
  margin: 0;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.iai-libretto-subtitle {
  color: #85b7eb;
  font-size: 10px;
}

.iai-libretto-block {
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
  padding: 8px 0;
}

.iai-libretto-block:last-child {
  border-bottom: none;
}

.iai-libretto-block--spacer {
  padding: 0;
  border-bottom: 1.5px solid #d3d1c7;
}

.iai-libretto-grid {
  display: grid;
  gap: 0;
}

.iai-libretto-grid--wide {
  grid-template-columns: minmax(180px, 180px) minmax(0, 1fr);
}

.iai-libretto-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.iai-libretto-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.iai-libretto-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.iai-libretto-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.iai-libretto-block .iai-libretto-grid {
  margin: 0;
}

.iai-libretto-cell {
  padding: 8px 12px;
  border-right: 0.5px solid rgba(0, 0, 0, 0.06);
}

.iai-libretto-cell:last-child {
  border-right: none;
}

.iai-libretto-grid > .iai-libretto-cell {
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
}

.iai-libretto-grid .iai-libretto-cell:first-child,
.iai-libretto-grid--2 .iai-libretto-cell:first-child,
.iai-libretto-grid--3 .iai-libretto-cell:first-child,
.iai-libretto-grid--4 .iai-libretto-cell:first-child {
  border-top: none;
}

.iai-libretto-cell--plaque {
  border-right: 0.5px solid rgba(0, 0, 0, 0.06);
}

.iai-field-wrap {
  display: block;
  padding: 8px 12px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
  border-right: 0.5px solid rgba(0, 0, 0, 0.06);
}

.iai-libretto-grid .iai-field-wrap:last-child,
.iai-libretto-grid .iai-field-wrap:nth-last-child(-n + 1) {
  border-right: none;
}

.iai-section-title {
  margin: 0;
  padding: 4px 12px;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888780;
  font-weight: 700;
}

.iai-field-code {
  margin-bottom: 2px;
  display: block;
  font-size: 7px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b4b2a9;
  font-weight: 700;
}

.iai-field-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: #1a1a18;
  outline: none;
  font-family: inherit;
  padding: 2px 0 3px;
  transition: border-color 0.15s;
}

.iai-field-input:focus {
  border-bottom-color: #185fa5;
  background: #f5f9ff;
  padding: 2px 4px 3px;
  border-radius: 2px 2px 0 0;
}

.iai-field-input::placeholder {
  color: #d3d1c7;
  font-weight: 400;
  font-size: 11px;
}

.iai-field-input--bold {
  font-size: 13px;
  font-weight: 700;
}

.iai-field-input--mono,
.iai-field-input--date {
  font-family: "Courier New", monospace;
  letter-spacing: 0.04em;
  font-size: 11px;
}

.iai-field-input--date {
  text-transform: uppercase;
}

.iai-field-input--red {
  color: #a32d2d;
  font-weight: 600;
}

.iai-detentore-label {
  text-align: right;
  font-size: 11px;
  font-weight: 700;
  color: #888780;
  padding: 6px 12px 0;
}

.iai-plaque {
  border: 2px solid #1a1a18;
  border-radius: 4px;
  overflow: hidden;
  height: 34px;
  display: flex;
  margin-top: 4px;
}

.iai-plaque-side {
  width: 22px;
  background: #1a3a5c;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
}

.iai-plaque-star {
  font-size: 7px;
  color: #f5c400;
}

.iai-plaque-i {
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
}

.iai-plaque-input {
  border: none;
  border-radius: 0;
  width: 140px;
  font-size: 17px;
  font-weight: 700;
  font-family: "Courier New", monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.iai-libretto-block--weights {
  background: #f8f8f6;
}

.iai-libretto-block--exams {
  background: #f8f8f6;
  border-top: 1.5px solid #d3d1c7;
}

.iai-exams-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.iai-exam-col {
  min-width: 0;
}

.iai-field-with-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.iai-field-badge {
  margin-left: 4px;
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
}

.iai-field-badge.is-expired {
  background: #faeeda;
  color: #633806;
}

.iai-field-badge.is-registered {
  background: #eaf3de;
  color: #27500a;
}

.iai-link-dup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.iai-vehicle-toggle {
  display: flex;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 14px;
}

.iai-toggle-btn {
  flex: 1;
  min-height: 36px;
  border: 0;
  background: #fff;
  color: #888780;
  border-right: 0.5px solid rgba(0, 0, 0, 0.12);
}

.iai-toggle-btn.is-active {
  background: #185fa5;
  color: #fff;
}

.iai-toggle-btn:last-child {
  border-right: 0;
}

.iai-field-select {
  width: 100%;
  font-size: 13px;
  border: 0.5px solid rgba(0, 0, 0, 0.22);
  border-radius: 6px;
  padding: 8px 10px;
  background: #fff;
  color: #1a1a18;
}

.iai-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
  margin: 12px 0;
}

.iai-checkline {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
}

.iai-checkline input {
  margin-top: 2px;
}

.iai-newvehicle-banner {
  background: #f0faf4;
  border: 0.5px solid #2d8a4e;
  border-radius: 7px;
  padding: 9px 12px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.iai-newvehicle-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2d8a4e;
  margin-top: 4px;
  flex-shrink: 0;
}

.iai-newvehicle-banner p {
  margin: 0;
  font-size: 11px;
  color: #1e6e3c;
}

.iai-dup-title {
  margin: 2px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a18;
}

.iai-btn-duplicate {
  margin: 8px 0 12px;
  min-height: 36px;
  width: 100%;
  border-radius: 8px;
  border: 0.5px solid rgba(0, 0, 0, 0.22);
  color: #5f5e5a;
  background: #fff;
  cursor: pointer;
}

.iai-btn-duplicate:hover {
  background: #f5f4f0;
}

.iai-dup-empty {
  background: #f5f4f0;
  border-radius: 7px;
  padding: 10px 12px;
}

.iai-dup-empty strong {
  color: #1a1a18;
  font-size: 12px;
  font-weight: 600;
}

.iai-dup-empty p {
  margin: 6px 0 0;
  font-size: 11px;
  color: #888780;
}

.iai-dup-copy {
  margin-top: 4px;
  margin-bottom: 10px;
}

.iai-confirm-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 20px;
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
}

.iai-confirm-title {
  font-size: 13px;
  font-weight: 600;
}

.iai-confirm-subtitle {
  margin: 4px 0 0;
  font-size: 11px;
  color: #888780;
}

.iai-btn-conferma {
  font-size: 13px;
  font-weight: 600;
  padding: 9px 22px;
  background: #2d8a4e;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
}

.iai-btn-conferma:hover {
  background: #1e6e3c;
}

.iai-btn-conferma:disabled {
  background: #3b6d11;
  cursor: default;
}

.iai-btn-conferma.is-complete {
  background: #3b6d11;
}

@media (max-width: 720px) {
  .iai-topbar,
  .iai-hero,
  .iai-content,
  .iai-dup-empty,
  .iai-link-dup-grid,
  .iai-libretto-grid--2,
  .iai-libretto-grid--3,
  .iai-exams-grid,
  .iai-confirm-bar {
    padding-left: 14px;
    padding-right: 14px;
  }

  .iai-content,
  .iai-hero,
  .iai-topbar {
    padding-right: 14px;
    padding-left: 14px;
  }

  .iai-link-dup-grid,
  .iai-libretto-grid--2,
  .iai-libretto-grid--3,
  .iai-exams-grid {
    grid-template-columns: 1fr;
  }

  .iai-libretto-card,
  .iai-confirm-bar {
    border-radius: 10px;
  }

  .iai-confirm-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .iai-btn-scarta,
  .iai-btn-conferma,
  .iai-btn-analizza {
    width: 100%;
  }
}
```

### 1.2 src/next/internal-ai/next-estrazione-libretto.css (importato da src/next/internal-ai/NextEstrazioneLibretto.tsx:11)
```css
.iai-libretto-extraction,
.iai-libretto-extraction *,
.iai-libretto-extraction *::before,
.iai-libretto-extraction *::after {
  box-sizing: border-box;
}

.iai-libretto-extraction {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-height: calc(100vh - 48px);
  overflow: auto;
  background: #f5f4f0;
  color: #1a1a18;
  font-family: "DM Sans", "Segoe UI", system-ui, sans-serif;
}

.iai-libretto-extraction .iai-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: #fff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}

.iai-libretto-extraction .iai-topbar-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #888780;
}

.iai-libretto-extraction .iai-btn-storico,
.iai-libretto-extraction .iai-btn-cambia,
.iai-libretto-extraction .iai-btn-scarta,
.iai-libretto-extraction .iai-btn-analizza,
.iai-libretto-extraction .iai-btn-duplicate,
.iai-libretto-extraction .iai-viewer-btn,
.iai-libretto-extraction .iai-btn-conferma,
.iai-libretto-extraction .iai-toggle-btn {
  font-family: inherit;
}

.iai-libretto-extraction .iai-btn-storico,
.iai-libretto-extraction .iai-btn-cambia,
.iai-libretto-extraction .iai-btn-scarta {
  font-size: 12px;
  padding: 5px 13px;
  border: 0.5px solid rgba(0, 0, 0, 0.22);
  border-radius: 6px;
  background: #fff;
  color: #5f5e5a;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s;
}

.iai-libretto-extraction .iai-btn-storico:hover,
.iai-libretto-extraction .iai-btn-cambia:hover,
.iai-libretto-extraction .iai-btn-scarta:hover,
.iai-libretto-extraction .iai-btn-duplicate:hover {
  background: #f5f4f0;
}

.iai-libretto-extraction .iai-hero {
  padding: 22px 24px 16px;
  background: #fff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}

.iai-libretto-extraction .iai-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.iai-libretto-extraction .iai-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 24px 24px;
}

.iai-libretto-extraction .iai-card,
.iai-libretto-extraction .iai-libretto-card,
.iai-libretto-extraction .iai-confirm-bar {
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
}

.iai-libretto-extraction .iai-card {
  padding: 16px 20px;
}

.iai-libretto-extraction .iai-sec-label,
.iai-libretto-extraction .iai-avviso-label,
.iai-libretto-extraction .iai-dd-sublabel {
  margin: 0 0 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.iai-libretto-extraction .iai-sec-label,
.iai-libretto-extraction .iai-dd-sublabel {
  color: #888780;
}

.iai-libretto-extraction .iai-dest-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.iai-libretto-extraction .iai-dest-badge,
.iai-libretto-extraction .iai-subtype-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0faf4;
  border: 1.5px solid #2d8a4e;
  border-radius: 8px;
}

.iai-libretto-extraction .iai-dest-badge {
  padding: 9px 16px;
}

.iai-libretto-extraction .iai-subtype-tab {
  width: fit-content;
  padding: 9px 18px;
}

.iai-libretto-extraction .iai-dest-dot,
.iai-libretto-extraction .iai-subtype-dot,
.iai-libretto-extraction .iai-newvehicle-dot {
  border-radius: 50%;
  background: #2d8a4e;
  flex-shrink: 0;
}

.iai-libretto-extraction .iai-dest-dot {
  width: 8px;
  height: 8px;
}

.iai-libretto-extraction .iai-subtype-dot,
.iai-libretto-extraction .iai-newvehicle-dot {
  width: 7px;
  height: 7px;
}

.iai-libretto-extraction .iai-dest-name,
.iai-libretto-extraction .iai-dest-ctx,
.iai-libretto-extraction .iai-subtype-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e6e3c;
}

.iai-libretto-extraction .iai-dest-arrow {
  color: #2d8a4e;
}

.iai-libretto-extraction .iai-dest-control {
  position: relative;
}

.iai-libretto-extraction .iai-dest-control summary {
  list-style: none;
}

.iai-libretto-extraction .iai-dest-control summary::-webkit-details-marker {
  display: none;
}

.iai-libretto-extraction .iai-dest-dropdown {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 240px;
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 20;
}

.iai-libretto-extraction .iai-dest-control[open] .iai-dest-dropdown,
.iai-libretto-extraction .iai-dest-dropdown.is-open {
  display: block;
}

.iai-libretto-extraction .iai-dd-sublabel {
  padding: 8px 14px 4px;
}

.iai-libretto-extraction .iai-dd-item {
  width: 100%;
  padding: 9px 14px;
  border: 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  color: #1a1a18;
  text-align: left;
  cursor: pointer;
}

.iai-libretto-extraction .iai-dd-item:last-child {
  border-bottom: none;
}

.iai-libretto-extraction .iai-dd-item:hover {
  background: #f5f4f0;
}

.iai-libretto-extraction .iai-subtype-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.iai-libretto-extraction .iai-libretto-subtype-note,
.iai-libretto-extraction .iai-upload-hint,
.iai-libretto-extraction .iai-confirm-subtitle,
.iai-libretto-extraction .iai-dup-empty p {
  margin: 0;
  font-size: 11px;
  color: #888780;
}

.iai-libretto-extraction .iai-upload-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.iai-libretto-extraction .iai-upload-picker {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.iai-libretto-extraction .iai-btn-upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 34px;
  padding: 7px 14px;
  border: 0.5px solid rgba(0, 0, 0, 0.22);
  border-radius: 6px;
  background: #fff;
  color: #1a1a18;
  font-size: 12px;
  font-weight: 600;
}

.iai-libretto-extraction .iai-upload-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.iai-libretto-extraction .iai-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  background: #f5f4f0;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  font-size: 12px;
}

.iai-libretto-extraction .iai-chip-badge {
  padding: 2px 7px;
  border-radius: 4px;
  background: #e6f1fb;
  color: #185fa5;
  font-size: 10px;
  font-weight: 500;
}

.iai-libretto-extraction .iai-btn-analizza,
.iai-libretto-extraction .iai-btn-conferma {
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: background 0.12s;
}

.iai-libretto-extraction .iai-btn-analizza {
  padding: 8px 20px;
  background: #185fa5;
  font-size: 13px;
  font-weight: 600;
}

.iai-libretto-extraction .iai-btn-analizza:hover {
  background: #0c447c;
}

.iai-libretto-extraction .iai-btn-analizza:disabled {
  background: rgba(0, 0, 0, 0.15);
  color: #888780;
  cursor: not-allowed;
}

.iai-libretto-extraction .iai-avvisi-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  background: #faeeda;
  border: 0.5px solid #ef9f27;
}

.iai-libretto-extraction .iai-avviso-label,
.iai-libretto-extraction .iai-avviso-dot {
  color: #854f0b;
}

.iai-libretto-extraction .iai-avviso-dot {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #854f0b;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.iai-libretto-extraction .iai-avviso-list {
  margin: 6px 0 0;
  padding-left: 16px;
  font-size: 12px;
  color: #633806;
  line-height: 1.5;
}

.iai-libretto-extraction .iai-completion-banner {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #2d8a4e;
  background: #eef8f0;
  color: #1e6e3c;
}

.iai-libretto-extraction .iai-completion-banner strong,
.iai-libretto-extraction .iai-completion-banner p {
  margin: 0;
}

.iai-libretto-extraction .iai-completion-banner p {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
}

.iai-libretto-extraction .iai-libretto-template--target {
  padding: 18px 18px 16px;
  overflow: hidden;
}

.iai-libretto-extraction .iai-target-sheet {
  display: grid;
  gap: 10px;
}

.iai-libretto-extraction .iai-target-sheet__scale {
  width: 100%;
  overflow-x: auto;
}

.iai-libretto-extraction .iai-target-sheet__spread {
  display: grid;
  grid-template-columns: 480px minmax(760px, 1fr);
  gap: 0;
  min-width: 1240px;
  border: 1.5px solid #777;
  background: #cfc9bc;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.iai-libretto-extraction .iai-target-page {
  background: #eceae2;
  display: flex;
  flex-direction: column;
  min-height: 920px;
  border-right: 1px solid #777;
}

.iai-libretto-extraction .iai-target-page:last-child {
  border-right: none;
}

.iai-libretto-extraction .iai-target-page__number {
  padding: 4px 0;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #555;
  border-bottom: 1px solid #aaa;
  background: #e2dfd7;
}

.iai-libretto-extraction .iai-target-row,
.iai-libretto-extraction .iai-target-tech-grid {
  display: flex;
  border-bottom: 1px solid #aaa;
}

.iai-libretto-extraction .iai-target-row:last-child {
  border-bottom: none;
}

.iai-libretto-extraction .iai-target-rail,
.iai-libretto-extraction .iai-target-code {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
  border-right: 1px solid #aaa;
  background: #e6e3db;
  color: #333;
  text-align: center;
  flex-shrink: 0;
}

.iai-libretto-extraction .iai-target-rail {
  width: 28px;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.iai-libretto-extraction .iai-target-code {
  width: 64px;
  font-size: 11px;
  font-weight: 700;
  background: #e7e2d8;
}

.iai-libretto-extraction .iai-target-code--highlight {
  background: #dedad0;
}

.iai-libretto-extraction .iai-target-main,
.iai-libretto-extraction .iai-target-side,
.iai-libretto-extraction .iai-target-mini {
  min-width: 0;
  border-right: 1px solid #aaa;
}

.iai-libretto-extraction .iai-target-main {
  flex: 1;
}

.iai-libretto-extraction .iai-target-side {
  width: 200px;
}

.iai-libretto-extraction .iai-target-mini {
  width: 170px;
}

.iai-libretto-extraction .iai-target-main:last-child,
.iai-libretto-extraction .iai-target-side:last-child,
.iai-libretto-extraction .iai-target-mini:last-child {
  border-right: none;
}

.iai-libretto-extraction .iai-target-main--stack {
  display: grid;
}

.iai-libretto-extraction .iai-target-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  flex: 1;
}

.iai-libretto-extraction .iai-target-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  background: #dedad0;
  border-bottom: 1px solid #aaa;
}

.iai-libretto-extraction .iai-target-strip span {
  padding: 6px 10px;
  border-right: 1px solid #aaa;
  font-size: 8px;
  font-style: italic;
  color: #444;
}

.iai-libretto-extraction .iai-target-strip span:last-child {
  border-right: none;
}

.iai-libretto-extraction .iai-target-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 7px 10px;
}

.iai-libretto-extraction .iai-target-field + .iai-target-field {
  border-left: 1px solid #aaa;
}

.iai-libretto-extraction .iai-target-field--compact {
  padding: 5px 10px;
}

.iai-libretto-extraction .iai-target-field--strong .iai-target-field__label,
.iai-libretto-extraction .iai-target-field--plate .iai-target-field__label {
  font-weight: 700;
}

.iai-libretto-extraction .iai-target-field--notes {
  padding: 0;
}

.iai-libretto-extraction .iai-target-field__label {
  font-size: 8px;
  line-height: 1.25;
  color: #444;
  font-style: italic;
}

.iai-libretto-extraction .iai-target-field__label--sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.iai-libretto-extraction .iai-target-tech-grid__left,
.iai-libretto-extraction .iai-target-tech-grid__right {
  display: grid;
  min-width: 0;
}

.iai-libretto-extraction .iai-target-tech-grid__left {
  width: 300px;
  border-right: 1px solid #aaa;
}

.iai-libretto-extraction .iai-target-tech-grid__right {
  flex: 1;
}

.iai-libretto-extraction .iai-target-tech-grid__left .iai-target-field,
.iai-libretto-extraction .iai-target-tech-grid__right .iai-target-field {
  border-bottom: 1px solid #aaa;
}

.iai-libretto-extraction .iai-target-tech-grid__left .iai-target-field:last-child,
.iai-libretto-extraction .iai-target-tech-grid__right .iai-target-field:last-child {
  border-bottom: none;
}

.iai-libretto-extraction .iai-target-row--plate .iai-target-main {
  background: #f0ece2;
}

.iai-libretto-extraction .iai-target-row--collaudo {
  background: #dedad0;
}

.iai-libretto-extraction .iai-target-row--notes {
  flex: 1;
  min-height: 360px;
  flex-direction: column;
}

.iai-libretto-extraction .iai-target-row--notes .iai-target-main {
  flex: 1;
  border-right: none;
}

.iai-libretto-extraction .iai-target-sheet__note {
  text-align: center;
  font-size: 10px;
  color: #6c685f;
}

.iai-libretto-extraction .iai-target-page .iai-template-input-wrap,
.iai-libretto-extraction .iai-target-page .iai-template-plate {
  min-width: 0;
}

.iai-libretto-extraction .iai-target-page .iai-template-input,
.iai-libretto-extraction .iai-target-page .iai-template-plate__input {
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
}

.iai-libretto-extraction .iai-target-page .iai-template-input {
  min-height: 18px;
  font-size: 13px;
}

.iai-libretto-extraction .iai-target-page .iai-template-input.is-mono,
.iai-libretto-extraction .iai-target-page .iai-template-plate__input {
  font-family: "Courier New", monospace;
  letter-spacing: 0.03em;
}

.iai-libretto-extraction .iai-target-page .iai-template-input.is-date {
  font-weight: 700;
}

.iai-libretto-extraction .iai-target-page .iai-template-input.is-textarea {
  min-height: 280px;
  padding: 10px 14px;
  resize: vertical;
  line-height: 1.55;
  font-size: 12px;
}

.iai-libretto-extraction .iai-target-page .iai-template-input:focus,
.iai-libretto-extraction .iai-target-page .iai-template-plate__input:focus,
.iai-libretto-extraction .iai-target-page .iai-template-input.is-textarea:focus {
  background: rgba(255, 250, 170, 0.82);
  outline: none;
}

.iai-libretto-extraction .iai-target-page .iai-template-plate {
  width: 100%;
  min-height: 60px;
  border: none;
  background: transparent;
  border-radius: 0;
}

.iai-libretto-extraction .iai-target-page .iai-template-plate__side {
  width: 74px;
  border-right: 1px solid #aaa;
  background: #183a5d;
  color: #fff;
}

.iai-libretto-extraction .iai-target-page .iai-template-plate__country,
.iai-libretto-extraction .iai-target-page .iai-template-plate__star {
  color: #fff;
}

.iai-libretto-extraction .iai-target-page .iai-template-plate__input {
  padding: 0 16px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.iai-libretto-extraction .iai-target-page .iai-template-badge {
  margin-left: 10px;
  align-self: center;
  padding: 2px 8px;
  font-size: 9px;
}

.iai-libretto-extraction .iai-target-page .iai-template-badge.is-expired {
  background: #faeeda;
  color: #633806;
}

.iai-libretto-extraction .iai-debug-tools {
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  background: #f7f3ea;
  overflow: hidden;
}

.iai-libretto-extraction .iai-debug-tools summary {
  cursor: pointer;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #6f5630;
  list-style: none;
}

.iai-libretto-extraction .iai-debug-tools summary::-webkit-details-marker {
  display: none;
}

.iai-libretto-extraction .iai-debug-tools__body {
  display: grid;
  gap: 12px;
  padding: 0 12px 12px;
}

.iai-libretto-extraction .iai-card--debug {
  padding: 14px 16px;
  background: #fffaf2;
}

.iai-libretto-extraction .iai-confirm-state {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
}

.iai-libretto-extraction .iai-confirm-state strong,
.iai-libretto-extraction .iai-confirm-state p {
  margin: 0;
}

.iai-libretto-extraction .iai-confirm-state p {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
}

.iai-libretto-extraction .iai-confirm-state.is-blocked {
  border-color: #ef9f27;
  background: #fff7eb;
  color: #6e470f;
}

.iai-libretto-extraction .iai-confirm-state.is-ready {
  border-color: #185fa5;
  background: #eef6fd;
  color: #124a82;
}

.iai-libretto-extraction .iai-confirm-state.is-saving {
  border-color: #185fa5;
  background: #eef6fd;
  color: #124a82;
}

.iai-libretto-extraction .iai-confirm-state.is-success {
  border-color: #2d8a4e;
  background: #eef8f0;
  color: #1e6e3c;
}

.iai-libretto-extraction .iai-confirm-state.is-error {
  border-color: #c23d2a;
  background: #fff0ed;
  color: #8a2417;
}

.iai-libretto-extraction .iai-confirm-state__list {
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.5;
}

.iai-libretto-extraction .iai-viewer {
  overflow: hidden;
  border-radius: 10px;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
}

.iai-libretto-extraction .iai-viewer-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: #2c2c2a;
}

.iai-libretto-extraction .iai-viewer-filename {
  margin-right: auto;
  color: #d3d1c7;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iai-libretto-extraction .iai-viewer-btn {
  padding: 3px 9px;
  border-radius: 5px;
  border: 0.5px solid #5f5e5a;
  background: transparent;
  color: #b4b2a9;
  font-size: 10px;
  cursor: pointer;
}

.iai-libretto-extraction .iai-viewer-btn:hover {
  background: #444441;
}

.iai-libretto-extraction .iai-viewer-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.iai-libretto-extraction .iai-viewer-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 16px;
  background: #3a3a38;
  overflow: auto;
}

.iai-libretto-extraction .iai-viewer-img,
.iai-libretto-extraction .iai-viewer-frame,
.iai-libretto-extraction .iai-viewer-text {
  width: 100%;
  max-width: 100%;
  min-height: 268px;
  border-radius: 3px;
}

.iai-libretto-extraction .iai-viewer-img {
  max-height: 268px;
  object-fit: contain;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.3);
  transform-origin: center center;
  transition: transform 0.16s ease;
}

.iai-libretto-extraction .iai-viewer-frame {
  border: 0;
  background: #fff;
}

.iai-libretto-extraction .iai-viewer-text {
  margin: 0;
  padding: 16px;
  background: #fff;
  color: #1a1a18;
  white-space: pre-wrap;
  overflow: auto;
}

.iai-libretto-extraction .iai-viewer-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 268px;
  border-radius: 3px;
  background: #fff;
}

.iai-libretto-extraction .iai-debug-image-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.iai-libretto-extraction .iai-viewer-body--debug {
  min-height: 180px;
  padding: 10px;
}

.iai-libretto-extraction .iai-template-debug-list {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

.iai-libretto-extraction .iai-libretto-template {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: linear-gradient(180deg, #fdfcf8 0%, #f5f0e4 100%);
  border: 1px solid rgba(82, 67, 34, 0.18);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(46, 35, 12, 0.08);
}

.iai-libretto-extraction .iai-libretto-template__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.iai-libretto-extraction .iai-libretto-template__header h2,
.iai-libretto-extraction .iai-libretto-template__header p {
  margin: 0;
}

.iai-libretto-extraction .iai-libretto-template__header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #3f331b;
}

.iai-libretto-extraction .iai-libretto-template__eyebrow {
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #867455;
}

.iai-libretto-extraction .iai-libretto-template__tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: #efe2bf;
  color: #6b4e10;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.iai-libretto-extraction .iai-libretto-sheet__paper {
  overflow: hidden;
  border: 1px solid rgba(82, 67, 34, 0.18);
  border-radius: 10px;
  background: #fffdfa;
}

.iai-libretto-extraction .iai-libretto-zone {
  border-top: 1px solid rgba(82, 67, 34, 0.14);
  background: transparent;
}

.iai-libretto-extraction .iai-libretto-sheet__band:first-child {
  border-top: none;
}

.iai-libretto-extraction .iai-libretto-zone__header {
  padding: 10px 14px 8px;
  background: #f4ecd8;
  border-bottom: 1px solid rgba(82, 67, 34, 0.12);
}

.iai-libretto-extraction .iai-libretto-zone__header h3,
.iai-libretto-extraction .iai-libretto-zone__header p {
  margin: 0;
}

.iai-libretto-extraction .iai-libretto-zone__header h3 {
  font-size: 13px;
  font-weight: 700;
  color: #4a3a17;
}

.iai-libretto-extraction .iai-libretto-zone__header p {
  margin-top: 4px;
  font-size: 11px;
  color: #8b7b5c;
}

.iai-libretto-extraction .iai-libretto-zone__grid {
  display: grid;
  gap: 0;
}

.iai-libretto-extraction .iai-libretto-zone__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-right: 1px solid rgba(82, 67, 34, 0.08);
  border-bottom: 1px solid rgba(82, 67, 34, 0.08);
  min-height: 88px;
  background: rgba(255, 253, 248, 0.88);
}

.iai-libretto-extraction .iai-libretto-zone__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7e7056;
}

.iai-libretto-extraction .iai-template-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.iai-libretto-extraction .iai-template-input,
.iai-libretto-extraction .iai-template-plate__input {
  width: 100%;
  border: none;
  border-bottom: 1px solid rgba(82, 67, 34, 0.2);
  background: transparent;
  color: #2f2516;
  padding: 4px 0 6px;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
}

.iai-libretto-extraction .iai-template-input:focus,
.iai-libretto-extraction .iai-template-plate__input:focus {
  border-bottom-color: #946d1a;
}

.iai-libretto-extraction .iai-template-input.is-mono,
.iai-libretto-extraction .iai-template-input.is-date,
.iai-libretto-extraction .iai-template-plate__input {
  font-family: "Courier New", monospace;
}

.iai-libretto-extraction .iai-template-input.is-date {
  color: #8a1f1f;
}

.iai-libretto-extraction .iai-template-input.is-textarea {
  min-height: 96px;
  resize: vertical;
  border: 1px solid rgba(18, 45, 72, 0.16);
  border-radius: 8px;
  padding: 10px 12px;
}

.iai-libretto-extraction .iai-template-badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.iai-libretto-extraction .iai-template-badge.is-active {
  background: #e9f4df;
  color: #27500a;
}

.iai-libretto-extraction .iai-template-badge.is-expired {
  background: #faeeda;
  color: #633806;
}

.iai-libretto-extraction .iai-template-plate {
  display: flex;
  align-items: stretch;
  min-height: 46px;
  overflow: hidden;
  border: 2px solid #10253b;
  border-radius: 8px;
  background: #fff;
}

.iai-libretto-extraction .iai-template-plate__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  background: #174972;
  color: #fff;
  gap: 2px;
}

.iai-libretto-extraction .iai-template-plate__star {
  font-size: 10px;
  color: #f3d44d;
}

.iai-libretto-extraction .iai-template-plate__country {
  font-size: 9px;
  font-weight: 700;
}

.iai-libretto-extraction .iai-template-plate__input {
  padding: 0 12px;
  border-bottom: none;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.iai-libretto-extraction .iai-libretto-card {
  overflow: hidden;
}

.iai-libretto-extraction .iai-libretto-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #1a3a5c;
}

.iai-libretto-extraction .iai-libretto-header p,
.iai-libretto-extraction .iai-libretto-subtitle {
  margin: 0;
}

.iai-libretto-extraction .iai-libretto-header p {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.iai-libretto-extraction .iai-libretto-subtitle {
  color: #85b7eb;
  font-size: 10px;
}

.iai-libretto-extraction .iai-libretto-block {
  padding: 8px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
}

.iai-libretto-extraction .iai-libretto-block:last-child {
  border-bottom: none;
}

.iai-libretto-extraction .iai-libretto-block--spacer {
  padding: 0;
  border-bottom: 1.5px solid #d3d1c7;
}

.iai-libretto-extraction .iai-libretto-block--weights,
.iai-libretto-extraction .iai-libretto-block--exams {
  background: #f8f8f6;
}

.iai-libretto-extraction .iai-libretto-block--exams {
  border-top: 1.5px solid #d3d1c7;
}

.iai-libretto-extraction .iai-libretto-grid,
.iai-libretto-extraction .iai-exams-grid,
.iai-libretto-extraction .iai-link-dup-grid {
  display: grid;
  gap: 0;
}

.iai-libretto-extraction .iai-libretto-grid--wide {
  grid-template-columns: 180px minmax(0, 1fr);
}

.iai-libretto-extraction .iai-libretto-grid--single {
  grid-template-columns: 1fr;
}

.iai-libretto-extraction .iai-libretto-grid--2,
.iai-libretto-extraction .iai-exams-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.iai-libretto-extraction .iai-libretto-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.iai-libretto-extraction .iai-libretto-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.iai-libretto-extraction .iai-link-dup-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.iai-libretto-extraction .iai-libretto-cell,
.iai-libretto-extraction .iai-field-wrap {
  display: block;
  padding: 8px 12px;
}

.iai-libretto-extraction .iai-libretto-cell {
  border-right: 0.5px solid rgba(0, 0, 0, 0.06);
}

.iai-libretto-extraction .iai-libretto-cell:last-child {
  border-right: none;
}

.iai-libretto-extraction .iai-field-wrap {
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
  border-right: 0.5px solid rgba(0, 0, 0, 0.06);
}

.iai-libretto-extraction .iai-libretto-grid > .iai-field-wrap:last-child,
.iai-libretto-extraction .iai-libretto-grid > .iai-field-wrap:nth-last-child(-n + 1) {
  border-right: none;
}

.iai-libretto-extraction .iai-section-title,
.iai-libretto-extraction .iai-field-code {
  display: block;
  font-weight: 700;
  text-transform: uppercase;
}

.iai-libretto-extraction .iai-section-title {
  margin: 0;
  padding: 4px 12px;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: #888780;
}

.iai-libretto-extraction .iai-field-code {
  margin-bottom: 2px;
  font-size: 7px;
  letter-spacing: 0.08em;
  color: #b4b2a9;
}

.iai-libretto-extraction .iai-field-input,
.iai-libretto-extraction .iai-plaque-input,
.iai-libretto-extraction .iai-field-select {
  width: 100%;
  font-family: inherit;
}

.iai-libretto-extraction .iai-field-input,
.iai-libretto-extraction .iai-plaque-input {
  padding: 2px 0 3px;
  border: none;
  background: transparent;
  color: #1a1a18;
  outline: none;
}

.iai-libretto-extraction .iai-field-input {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 12px;
  font-weight: 500;
}

.iai-libretto-extraction .iai-field-input:focus {
  border-bottom-color: #185fa5;
  background: #f5f9ff;
  padding: 2px 4px 3px;
  border-radius: 2px 2px 0 0;
}

.iai-libretto-extraction .iai-field-input--bold {
  font-size: 13px;
  font-weight: 700;
}

.iai-libretto-extraction .iai-field-input--mono,
.iai-libretto-extraction .iai-field-input--date,
.iai-libretto-extraction .iai-plaque-input {
  font-family: "Courier New", monospace;
}

.iai-libretto-extraction .iai-field-input--mono,
.iai-libretto-extraction .iai-field-input--date {
  font-size: 11px;
  letter-spacing: 0.04em;
}

.iai-libretto-extraction .iai-field-input--red {
  color: #a32d2d;
  font-weight: 600;
}

.iai-libretto-extraction .iai-detentore-label {
  padding: 6px 12px 0;
  text-align: right;
  font-size: 11px;
  font-weight: 700;
  color: #888780;
}

.iai-libretto-extraction .iai-plaque {
  display: flex;
  height: 34px;
  margin-top: 4px;
  overflow: hidden;
  border: 2px solid #1a1a18;
  border-radius: 4px;
}

.iai-libretto-extraction .iai-plaque-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 22px;
  gap: 2px;
  background: #1a3a5c;
  color: #fff;
}

.iai-libretto-extraction .iai-plaque-star {
  color: #f5c400;
  font-size: 7px;
}

.iai-libretto-extraction .iai-plaque-i {
  font-size: 8px;
  font-weight: 700;
}

.iai-libretto-extraction .iai-plaque-input {
  width: 140px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.iai-libretto-extraction .iai-field-with-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.iai-libretto-extraction .iai-field-badge {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
}

.iai-libretto-extraction .iai-field-badge.is-expired {
  background: #faeeda;
  color: #633806;
}

.iai-libretto-extraction .iai-field-badge.is-registered {
  background: #eaf3de;
  color: #27500a;
}

.iai-libretto-extraction .iai-vehicle-toggle {
  display: flex;
  margin-bottom: 14px;
  overflow: hidden;
  border-radius: 7px;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
}

.iai-libretto-extraction .iai-toggle-btn {
  flex: 1;
  min-height: 36px;
  border: 0;
  border-right: 0.5px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  color: #888780;
  cursor: pointer;
}

.iai-libretto-extraction .iai-toggle-btn.is-active {
  background: #185fa5;
  color: #fff;
}

.iai-libretto-extraction .iai-toggle-btn:last-child {
  border-right: 0;
}

.iai-libretto-extraction .iai-field-select {
  padding: 8px 10px;
  border: 0.5px solid rgba(0, 0, 0, 0.22);
  border-radius: 6px;
  background: #fff;
  color: #1a1a18;
  font-size: 13px;
}

.iai-libretto-extraction .iai-divider {
  height: 1px;
  margin: 12px 0;
  background: rgba(0, 0, 0, 0.12);
}

.iai-libretto-extraction .iai-checkline {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
}

.iai-libretto-extraction .iai-checkline input {
  margin-top: 2px;
}

.iai-libretto-extraction .iai-newvehicle-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 7px;
  background: #f0faf4;
  border: 0.5px solid #2d8a4e;
}

.iai-libretto-extraction .iai-newvehicle-banner p {
  margin: 0;
  font-size: 11px;
  color: #1e6e3c;
}

.iai-libretto-extraction .iai-btn-upload--small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 12px;
}

.iai-libretto-extraction .iai-vehicle-photo {
  display: grid;
  gap: 8px;
}

.iai-libretto-extraction .iai-vehicle-photo__row {
  display: grid;
  gap: 12px;
  grid-template-columns: 160px 1fr;
}

.iai-libretto-extraction .iai-vehicle-photo__preview {
  min-height: 120px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  overflow: hidden;
  background: #f6f4ef;
}

.iai-libretto-extraction .iai-vehicle-photo__preview img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 180px;
  object-fit: cover;
}

.iai-libretto-extraction .iai-vehicle-photo__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #6d685c;
}

.iai-libretto-extraction .iai-vehicle-photo__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.iai-libretto-extraction .iai-vehicle-photo__picker {
  position: relative;
  isolation: isolate;
}

.iai-libretto-extraction .iai-vehicle-photo__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.iai-libretto-extraction .iai-vehicle-photo__name {
  font-size: 12px;
  color: #595750;
  word-break: break-word;
}

.iai-libretto-extraction .iai-dup-title,
.iai-libretto-extraction .iai-confirm-title {
  color: #1a1a18;
  font-weight: 600;
}

.iai-libretto-extraction .iai-dup-title {
  margin: 2px 0 8px;
  font-size: 13px;
}

.iai-libretto-extraction .iai-dup-copy {
  margin: 4px 0 10px;
}

.iai-libretto-extraction .iai-btn-duplicate {
  width: 100%;
  min-height: 36px;
  margin: 8px 0 12px;
  border-radius: 8px;
  border: 0.5px solid rgba(0, 0, 0, 0.22);
  background: #fff;
  color: #5f5e5a;
  cursor: pointer;
}

.iai-libretto-extraction .iai-dup-empty {
  padding: 10px 12px;
  border-radius: 7px;
  background: #f5f4f0;
}

.iai-libretto-extraction .iai-dup-empty.is-ready {
  background: #edf6e8;
}

.iai-libretto-extraction .iai-dup-empty strong {
  font-size: 12px;
  color: #1a1a18;
}

.iai-libretto-extraction .iai-dup-results {
  display: grid;
  gap: 10px;
}

.iai-libretto-extraction .iai-dup-card {
  padding: 12px;
  border: 1px solid rgba(26, 26, 24, 0.12);
  border-radius: 8px;
  background: #fff;
}

.iai-libretto-extraction .iai-dup-card.is-selected {
  border-color: #185fa5;
  box-shadow: 0 0 0 1px rgba(24, 95, 165, 0.18);
}

.iai-libretto-extraction .iai-dup-card p {
  margin: 8px 0 0;
  font-size: 12px;
  color: #55544f;
}

.iai-libretto-extraction .iai-dup-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.iai-libretto-extraction .iai-dup-card__select {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(24, 95, 165, 0.24);
  border-radius: 999px;
  background: #eff5fb;
  color: #185fa5;
  cursor: pointer;
}

.iai-libretto-extraction .iai-dup-card__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.iai-libretto-extraction .iai-dup-card__pill {
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3efe4;
  font-size: 11px;
  color: #5d5139;
}

.iai-libretto-extraction .iai-dup-choice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.iai-libretto-extraction .iai-dup-choice {
  min-height: 36px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 8px;
  background: #fff;
  color: #3d3c39;
  cursor: pointer;
}

.iai-libretto-extraction .iai-dup-choice.is-active {
  border-color: #185fa5;
  background: #185fa5;
  color: #fff;
}

.iai-libretto-extraction .iai-confirm-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 20px;
}

.iai-libretto-extraction .iai-btn-conferma {
  padding: 9px 22px;
  background: #2d8a4e;
  font-size: 13px;
  font-weight: 600;
}

.iai-libretto-extraction .iai-btn-conferma:hover {
  background: #1e6e3c;
}

.iai-libretto-extraction .iai-btn-conferma:disabled,
.iai-libretto-extraction .iai-btn-conferma.is-complete {
  background: #3b6d11;
  cursor: default;
}

@media (max-width: 720px) {
  .iai-libretto-extraction .iai-topbar,
  .iai-libretto-extraction .iai-hero,
  .iai-libretto-extraction .iai-content {
    padding-left: 14px;
    padding-right: 14px;
  }

  .iai-libretto-extraction .iai-link-dup-grid,
  .iai-libretto-extraction .iai-libretto-template__header,
  .iai-libretto-extraction .iai-libretto-zone__grid,
  .iai-libretto-extraction .iai-libretto-grid--2,
  .iai-libretto-extraction .iai-libretto-grid--3,
  .iai-libretto-extraction .iai-libretto-grid--4,
  .iai-libretto-extraction .iai-libretto-grid--wide,
  .iai-libretto-extraction .iai-exams-grid,
  .iai-libretto-extraction .iai-vehicle-photo__row {
    grid-template-columns: 1fr;
  }

  .iai-libretto-extraction .iai-confirm-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .iai-libretto-extraction .iai-libretto-zone__field {
    grid-column: span 1 !important;
    border-right: none;
  }

  .iai-libretto-extraction .iai-btn-analizza,
  .iai-libretto-extraction .iai-btn-scarta,
  .iai-libretto-extraction .iai-btn-conferma {
    width: 100%;
  }
}
```

## 2. ELENCO SELETTORI iai-*
iai-avvisi-banner
iai-avviso-content
iai-avviso-dot
iai-avviso-label
iai-avviso-list
iai-btn-analizza
iai-btn-cambia
iai-btn-conferma
iai-btn-duplicate
iai-btn-scarta
iai-btn-storico
iai-btn-upload
iai-btn-upload--small
iai-card
iai-card--debug
iai-checkline
iai-chip-badge
iai-completion-banner
iai-confirm-bar
iai-confirm-state
iai-confirm-state__list
iai-confirm-subtitle
iai-confirm-title
iai-content
iai-dd-item
iai-dd-sublabel
iai-debug-image-grid
iai-debug-tools
iai-debug-tools__body
iai-dest-arrow
iai-dest-badge
iai-dest-control
iai-dest-ctx
iai-dest-dot
iai-dest-dropdown
iai-dest-name
iai-dest-row
iai-detentore-label
iai-divider
iai-doc-icon
iai-dup-card
iai-dup-card__head
iai-dup-card__pill
iai-dup-card__pills
iai-dup-card__select
iai-dup-choice
iai-dup-choice-grid
iai-dup-copy
iai-dup-empty
iai-dup-results
iai-dup-title
iai-exam-col
iai-exams-grid
iai-field-badge
iai-field-code
iai-field-input
iai-field-input--bold
iai-field-input--date
iai-field-input--mono
iai-field-input--red
iai-field-select
iai-field-with-badge
iai-field-wrap
iai-file-chip
iai-hero
iai-hero-title
iai-libretto-block
iai-libretto-block--exams
iai-libretto-block--spacer
iai-libretto-block--weights
iai-libretto-card
iai-libretto-cell
iai-libretto-cell--plaque
iai-libretto-extraction
iai-libretto-grid
iai-libretto-grid--2
iai-libretto-grid--3
iai-libretto-grid--4
iai-libretto-grid--single
iai-libretto-grid--wide
iai-libretto-header
iai-libretto-sheet__band
iai-libretto-sheet__paper
iai-libretto-subtitle
iai-libretto-subtype-note
iai-libretto-template
iai-libretto-template__eyebrow
iai-libretto-template__header
iai-libretto-template__tag
iai-libretto-template--target
iai-libretto-zone
iai-libretto-zone__field
iai-libretto-zone__grid
iai-libretto-zone__header
iai-libretto-zone__label
iai-link-dup-grid
iai-newvehicle-banner
iai-newvehicle-dot
iai-page
iai-plaque
iai-plaque-i
iai-plaque-input
iai-plaque-side
iai-plaque-star
iai-sec-label
iai-section-title
iai-subtype-dot
iai-subtype-label
iai-subtype-shell
iai-subtype-tab
iai-target-code
iai-target-code--highlight
iai-target-field
iai-target-field__label
iai-target-field__label--sr
iai-target-field--compact
iai-target-field--notes
iai-target-field--plate
iai-target-field--strong
iai-target-main
iai-target-main--stack
iai-target-mini
iai-target-page
iai-target-page__number
iai-target-rail
iai-target-row
iai-target-row--collaudo
iai-target-row--notes
iai-target-row--plate
iai-target-sheet
iai-target-sheet__note
iai-target-sheet__scale
iai-target-sheet__spread
iai-target-side
iai-target-split
iai-target-strip
iai-target-tech-grid
iai-target-tech-grid__left
iai-target-tech-grid__right
iai-template-badge
iai-template-debug-list
iai-template-input
iai-template-input-wrap
iai-template-plate
iai-template-plate__country
iai-template-plate__input
iai-template-plate__side
iai-template-plate__star
iai-toggle-btn
iai-topbar
iai-topbar-label
iai-upload-hint
iai-upload-input
iai-upload-picker
iai-upload-row
iai-vehicle-photo
iai-vehicle-photo__actions
iai-vehicle-photo__input
iai-vehicle-photo__name
iai-vehicle-photo__picker
iai-vehicle-photo__placeholder
iai-vehicle-photo__preview
iai-vehicle-photo__row
iai-vehicle-toggle
iai-viewer
iai-viewer-body
iai-viewer-body--debug
iai-viewer-btn
iai-viewer-filename
iai-viewer-frame
iai-viewer-img
iai-viewer-placeholder
iai-viewer-placeholder-icon
iai-viewer-placeholder-name
iai-viewer-text
iai-viewer-toolbar

## 3. VARIABILI CSS
| nome variabile | path:riga di definizione | path:riga di uso |
| --- | --- | --- |
| non trovato | non trovato | non trovato |

## 4. NOTE FINALI (solo fatti)
- `src/next/internal-ai/NextEstrazioneLibretto.tsx:11` importa `src/next/internal-ai/next-estrazione-libretto.css`.
- `src/next/NextIAArchivistaPage.tsx:11` importa `src/next/internal-ai/internal-ai.css`.
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` non contiene import CSS diretto nei grep eseguiti.
- Nei due file CSS estratti non sono presenti `@import`.
- Nei due file CSS estratti non sono presenti custom properties CSS definite o usate con `var(...)`.

