import UI from './ActionTypes/ui';
import { createAction } from 'redux-actions';

export const toggleSidebar = createAction(UI.TOGGLE_SIDEBAR);