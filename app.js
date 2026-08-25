const SUPABASE_URL = 'https://slmkybvrquxknfrfwowi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ndMDTeABd9T1wgHWow3Lsg_kg_GReCI';
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const state = { songs: [], currentIndex: -1 };
const audio = document.querySelector('#audio');
const elements = {
  list: document.querySelector('#song-list'), adminList: document.querySelector('#admin-list'), empty: document.querySelector('#empty-state'), notice: document.querySelector('#notice'), count: document.querySelector('#song-count'), search: document.querySelector('#search-input'),
  title: document.querySelector('#title'), artist: document.querySelector('#artist'), album: document.querySelector('#album'), cover: document.querySelector('#cover-url'), audioUrl: document.querySelector('#audio-url'), id: document.querySelector('#song-id'), formHeading: document.querySelector('#form-heading'), cancel: document.querySelector('#cancel-edit'), submit: document.querySelector('#submit-song'), nowTitle: document.querySelector('#now-title'), nowArtist: document.querySelector('#now-artist'), nowCover: document.querySelector('#now-cover'), play: document.querySelector('#play-button'), progress: document.querySelector('#progress'), currentTime: document.querySelector('#current-time'), duration: document.querySelector('#duration'), volume: document.querySelector('#volume')
};

function showNotice(message, isError = false) { elements.notice.textContent = message; elements.notice.className = `notice${isError ? ' error' : ''}`; elements.notice.hidden = false; }
function clearNotice() { elements.notice.hidden = true; }
function formatTime(seconds) { if (!Number.isFinite(seconds)) return '0:00'; return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
function coverMarkup(song, className = 'cover') { return song.cover_url ? `<img class="${className}" src="${escapeHtml(song.cover_url)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'${className} cover-fallback',textContent:'♪'}))">` : `<span class="${className} cover-fallback">♪</span>`; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

function setActiveNavItem(targetId) {
  const navLinks = document.querySelectorAll('.nav-item, .brand, .avatar, .text-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const isMatch = href === `#${targetId}` || (targetId === 'library' && href === '#library');
    link.classList.toggle('active', isMatch);
  });
}

function handleHashNavigation(event) {
  const link = event.currentTarget;
  const targetId = link.getAttribute('href');
  if (!targetId || !targetId.startsWith('#')) return;
  const target = document.querySelector(targetId);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', targetId);
  setActiveNavItem(targetId.slice(1));
}

function renderSongs() {
  const query = elements.search.value.trim().toLowerCase();
  const visible = state.songs.filter(song => [song.title, song.artist, song.album].some(value => (value || '').toLowerCase().includes(query)));
  elements.count.textContent = `${state.songs.length} ${state.songs.length === 1 ? 'track' : 'tracks'}`;
  elements.list.innerHTML = visible.map((song, index) => { const actualIndex = state.songs.indexOf(song); return `<article class="song-row ${actualIndex === state.currentIndex ? 'playing' : ''}" data-index="${actualIndex}" tabindex="0"><span class="track-number">${String(index + 1).padStart(2, '0')}</span><div class="track-info">${coverMarkup(song)}<div class="track-text"><strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(song.artist)}</span></div></div><span class="album-name">${escapeHtml(song.album || 'Single')}</span><span class="length">—</span><button class="row-menu" data-menu-index="${actualIndex}" title="Play track" aria-label="Play ${escapeHtml(song.title)}">•••</button></article>`; }).join('');
  elements.empty.hidden = state.songs.length > 0 && visible.length > 0;
  if (state.songs.length > 0 && visible.length === 0) { elements.empty.hidden = false; elements.empty.querySelector('strong').textContent = 'No matches found.'; elements.empty.querySelector('span').textContent = 'Try a different title, artist, or album.'; }
  elements.list.querySelectorAll('.song-row').forEach(row => { row.addEventListener('click', event => { if (!event.target.closest('.row-menu')) playSong(Number(row.dataset.index)); }); row.addEventListener('keydown', event => { if (event.key === 'Enter') playSong(Number(row.dataset.index)); }); });
}
function renderAdmin() { elements.adminList.innerHTML = state.songs.map(song => `<div class="admin-item"><div><strong>${escapeHtml(song.title)}</strong><br><small>${escapeHtml(song.artist)}</small></div><div class="admin-actions"><button data-edit="${song.id}">Edit</button><button data-delete="${song.id}">Delete</button></div></div>`).join(''); elements.adminList.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => beginEdit(button.dataset.edit))); elements.adminList.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteSong(button.dataset.delete))); }

async function loadSongs() { clearNotice(); elements.list.innerHTML = '<div class="notice">Loading your library...</div>'; const { data, error } = await db.from('songs').select('*').order('created_at', { ascending: false }); if (error) { showNotice(`Could not load songs: ${error.message}`, true); elements.list.innerHTML = ''; return; } state.songs = data || []; renderSongs(); renderAdmin(); }
function playSong(index) { const song = state.songs[index]; if (!song) return; state.currentIndex = index; audio.src = song.audio_url; audio.play().catch(() => showNotice('Playback was blocked. Press play to start the track.', true)); elements.nowTitle.textContent = song.title; elements.nowArtist.textContent = song.artist; elements.nowCover.innerHTML = song.cover_url ? `<img src="${escapeHtml(song.cover_url)}" alt="">` : '<span>♪</span>'; elements.play.textContent = 'Ⅱ'; renderSongs(); }
function resetForm() { document.querySelector('#song-form').reset(); elements.id.value = ''; elements.formHeading.textContent = 'Add a song'; elements.submit.innerHTML = 'Save song <span>→</span>'; elements.cancel.hidden = true; }
function beginEdit(id) { const song = state.songs.find(item => String(item.id) === String(id)); if (!song) return; elements.id.value = song.id; elements.title.value = song.title; elements.artist.value = song.artist; elements.album.value = song.album || ''; elements.cover.value = song.cover_url || ''; elements.audioUrl.value = song.audio_url; elements.formHeading.textContent = 'Edit song'; elements.submit.innerHTML = 'Update song <span>→</span>'; elements.cancel.hidden = false; document.querySelector('#admin').scrollIntoView({ behavior: 'smooth' }); }
async function deleteSong(id) { if (!window.confirm('Delete this song from the library?')) return; const { error } = await db.from('songs').delete().eq('id', id); if (error) showNotice(`Could not delete song: ${error.message}`, true); else { if (state.currentIndex >= 0 && String(state.songs[state.currentIndex]?.id) === String(id)) audio.pause(); showNotice('Song deleted.'); loadSongs(); } }

document.querySelector('#song-form').addEventListener('submit', async event => { event.preventDefault(); elements.submit.disabled = true; const payload = { title: elements.title.value.trim(), artist: elements.artist.value.trim(), album: elements.album.value.trim(), cover_url: elements.cover.value.trim() || null, audio_url: elements.audioUrl.value.trim() }; const id = elements.id.value; const request = id ? db.from('songs').update(payload).eq('id', id) : db.from('songs').insert(payload); const { error } = await request; elements.submit.disabled = false; if (error) { showNotice(`Could not save song: ${error.message}`, true); return; } showNotice(id ? 'Song updated.' : 'Song added to your library.'); resetForm(); loadSongs(); });
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', handleHashNavigation));
window.addEventListener('hashchange', () => {
  const targetId = location.hash.replace('#', '');
  if (targetId) setActiveNavItem(targetId);
});

elements.cancel.addEventListener('click', resetForm); elements.search.addEventListener('input', renderSongs); document.querySelector('#refresh-button').addEventListener('click', loadSongs); document.querySelector('#play-button').addEventListener('click', () => { if (audio.src) audio.paused ? audio.play() : audio.pause(); }); document.querySelector('#previous-button').addEventListener('click', () => playSong((state.currentIndex - 1 + state.songs.length) % state.songs.length)); document.querySelector('#next-button').addEventListener('click', () => playSong((state.currentIndex + 1) % state.songs.length)); elements.volume.addEventListener('input', () => { audio.volume = elements.volume.value; }); elements.progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = (elements.progress.value / 100) * audio.duration; }); audio.volume = .8; audio.addEventListener('play', () => { elements.play.textContent = 'Ⅱ'; }); audio.addEventListener('pause', () => { elements.play.textContent = '▶'; }); audio.addEventListener('timeupdate', () => { elements.progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0; elements.currentTime.textContent = formatTime(audio.currentTime); }); audio.addEventListener('loadedmetadata', () => { elements.duration.textContent = formatTime(audio.duration); }); audio.addEventListener('ended', () => playSong((state.currentIndex + 1) % state.songs.length));
if (location.hash) {
  const targetId = location.hash.replace('#', '');
  const target = document.getElementById(targetId);
  if (target) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveNavItem(targetId);
    });
  }
}
loadSongs();
