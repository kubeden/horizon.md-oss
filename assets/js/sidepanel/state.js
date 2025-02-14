// assets/js/sidepanel/state.js
export const State = {
    currentUrl: null,
    currentTab: 'page',
    currentSearchQuery: '',
    currentFilter: 'all-time'
};

export function updateState(newState) {
    Object.assign(State, newState);
}