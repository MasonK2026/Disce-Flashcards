import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ChaptersPage } from './pages/ChaptersPage';
import { ChapterDetailPage } from './pages/ChapterDetailPage';
import { StudyPage } from './pages/StudyPage';
import { DecksPage } from './pages/DecksPage';
import { DeckDetailPage } from './pages/DeckDetailPage';
import { SearchPage } from './pages/SearchPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="chapters" element={<ChaptersPage />} />
          <Route path="chapters/:slug" element={<ChapterDetailPage />} />
          <Route path="study/:source" element={<StudyPage />} />
          <Route path="decks" element={<DecksPage />} />
          <Route path="decks/:id" element={<DeckDetailPage />} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
