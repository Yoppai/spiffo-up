import { beforeAll, describe, expect, it } from 'bun:test';
import { handleArchivedServersInput } from './archived-servers-input.js';
import { useAppStore } from '../../stores/app-store.js';
import { useServersStore } from '../../stores/servers-store.js';
import '../../i18n/config.js';
import { initializeI18n } from '../../i18n/config.js';
import i18next from 'i18next';

beforeAll(async () => {
  initializeI18n('en');
});

describe('handleArchivedServersInput', () => {
  it('up arrow decrements cursor in list mode', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-list');
    useAppStore.getState().moveGlobalRightCursor(1, 10);
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const navigation = app.navigation;

    handleArchivedServersInput({ app, key: { upArrow: true }, navigation, serverStore });

    expect(useAppStore.getState().navigation.globalRightCursor).toBe(0);
  });

  it('down arrow increments cursor in list mode', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-list');
    // Start at cursor 0, with 1 archived server moving down wraps back to 0
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const navigation = app.navigation;

    handleArchivedServersInput({ app, key: { downArrow: true }, navigation, serverStore });

    // With only 1 archived server, cursor wraps back to 0
    expect(useAppStore.getState().navigation.globalRightCursor).toBe(0);
  });

  it('ENTER changes mode to archived-detail', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-list');
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const navigation = app.navigation;

    handleArchivedServersInput({ app, key: { return: true }, navigation, serverStore });

    expect(useAppStore.getState().navigation.globalRightMode).toBe('archived-detail');
  });

  it('ESC in detail mode goes back to archived-list', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-detail');
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const navigation = app.navigation;

    handleArchivedServersInput({ app, key: { escape: true }, navigation, serverStore });

    expect(useAppStore.getState().navigation.globalRightMode).toBe('archived-list');
  });

  it('up/down arrows navigate actions in detail mode', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-detail');
    let app = useAppStore.getState();
    let serverStore = useServersStore.getState();
    let navigation = app.navigation;

    handleArchivedServersInput({ app, key: { downArrow: true }, navigation, serverStore });
    expect(useAppStore.getState().navigation.globalRightCursor).toBe(1);

    app = useAppStore.getState();
    serverStore = useServersStore.getState();
    navigation = app.navigation;
    handleArchivedServersInput({ app, key: { upArrow: true }, navigation, serverStore });
    expect(useAppStore.getState().navigation.globalRightCursor).toBe(0);
  });

  it('ENTER on Delete activates confirmation', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-detail');
    useAppStore.getState().moveGlobalRightCursor(1, 2); // Select Delete
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const navigation = app.navigation;

    handleArchivedServersInput({ app, key: { return: true }, navigation, serverStore });

    expect(useAppStore.getState().navigation.globalRightConfirmAction).toBe('delete');
  });

  it('second ENTER with confirm executes stub and clears confirm', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-detail');
    useAppStore.getState().moveGlobalRightCursor(1, 2);
    useAppStore.getState().setGlobalRightConfirmAction('delete');
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const navigation = app.navigation;

    handleArchivedServersInput({ app, key: { return: true }, navigation, serverStore });

    expect(useAppStore.getState().navigation.globalRightConfirmAction).toBeNull();
    expect(useAppStore.getState().navigation.globalRightMode).toBe('archived-list');
  });

  it('ESC cancels confirmation and clears globalRightConfirmAction', () => {
    useAppStore.getState().resetNavigation();
    useAppStore.getState().setGlobalRightMode('archived-detail');
    useAppStore.getState().setGlobalRightConfirmAction('delete');
    const app = useAppStore.getState();
    const serverStore = useServersStore.getState();
    const navigation = app.navigation;

    handleArchivedServersInput({ app, key: { escape: true }, navigation, serverStore });

    expect(useAppStore.getState().navigation.globalRightConfirmAction).toBeNull();
  });
});