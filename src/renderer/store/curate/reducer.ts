import { AddAppCuration, CurationState } from '@shared/curate/types';
import uuid = require('uuid');
import { CurateActionType } from './enums';
import { CurateAction, CurateState } from './types';

export function curateStateReducer(state: CurateState = createInitialState(), action: CurateAction): CurateState {
  switch (action.type) {
    default:
      return state;

    case CurateActionType.CREATE_CURATION:
      return {
        ...state,
        curations: [
          ...state.curations,
          {
            folder: action.folder,
            game: {},
            addApps: [],
            thumbnail: {
              exists: false,
              version: 0
            },
            screenshot: {
              exists: false,
              version: 0
            }
          },
        ],
      };

    case CurateActionType.SET_CURRENT_CURATION:
      return {
        ...state,
        current: action.folder,
      };

    case CurateActionType.NEW_ADDAPP: {
      const { index, newCurations } = genCurationState(action.folder, state);

      if (index === -1) { return { ...state }; }

      const newAddApp: AddAppCuration = {
        key: uuid(),
        launchCommand: ''
      };

      switch (action.addAppType) {
        case 'extras':
          newAddApp.heading = 'Extras';
          newAddApp.applicationPath = ':extras:';
          break;
        case 'message':
          newAddApp.heading = 'Message';
          newAddApp.applicationPath = ':message:';
          break;
        case 'normal':
          newAddApp.heading = '';
          newAddApp.applicationPath = '';
          break;
      }

      newCurations[index].addApps.push(newAddApp);

      return {
        ...state,
        curations: newCurations
      };
    }

    case CurateActionType.REMOVE_ADDAPP: {
      const { index, newCurations } = genCurationState(action.folder, state);

      if (index === -1) { return { ...state }; }

      const oldCuration = state.curations[index];
      const addAppIdx = oldCuration.addApps.findIndex(a => a.key === action.key);

      if (addAppIdx === -1) { return { ...state }; }

      newCurations[index].addApps.splice(addAppIdx, 1);

      return {
        ...state,
        curations: newCurations
      };
    }

    case CurateActionType.EDIT_ADDAPP: {
      const { index, newCurations } = genCurationState(action.folder, state);

      if (index === -1) { return { ...state }; }

      const oldCuration = state.curations[index];
      const addAppIdx = oldCuration.addApps.findIndex(a => a.key === action.key);

      if (addAppIdx === -1) { return { ...state }; }

      const newAddApp = { ...oldCuration.addApps[addAppIdx] };
      newAddApp[action.property] = action.value;
      newCurations[index].addApps[addAppIdx] = newAddApp;
      return {
        ...state,
        curations: newCurations
      };
    }

    case CurateActionType.EDIT_CURATION_META: {
      const index = state.curations.findIndex(curation => curation.folder === action.folder);

      if (index === -1) { return { ...state }; }

      const oldCuration = state.curations[index];

      const newCurations = [ ...state.curations ];
      newCurations[index] = {
        ...oldCuration,
        game: {
          ...oldCuration.game,
          [action.property]: action.value,
        },
      };

      return {
        ...state,
        curations: newCurations,
      };
    }

    case CurateActionType.ADD_TAG: {
      const { index, newCurations } = genCurationState(action.folder, state);
      const newTags = [...(newCurations[index].game.tags || [])];
      if (!newTags.find(t => t.id === action.tag.id)) {
        newTags.push(action.tag);
      }
      newCurations[index].game.tags = newTags;

      return {
        ...state,
        curations: newCurations
      };
    }

    case CurateActionType.REMOVE_TAG: {
      const { index, newCurations } = genCurationState(action.folder, state);
      const newTags = [...(newCurations[index].game.tags || [])];
      const tagIdx = newTags.findIndex(t => t.id === action.tagId);
      if (tagIdx > -1) {
        newTags.splice(tagIdx, 1);
      }
      newCurations[index].game.tags = newTags;

      return {
        ...state,
        curations: newCurations
      };
    }

    case CurateActionType.SET_ALL_CURATIONS:
      return {
        ...state,
        curations: [ ...action.curations ],
      };

    case CurateActionType.APPLY_DELTA: {
      const newCurations = [ ...state.curations ];

      if (action.removed) {
        for (let i = newCurations.length - 1; i >= 0; i--) {
          if (action.removed.indexOf(newCurations[i].folder) !== -1) {
            newCurations.splice(i, 1);
          }
        }
      }

      if (action.added) {
        for (const curation of action.added) {
          const existingIdx = newCurations.findIndex(c => c.folder === curation.folder);
          if (existingIdx > -1) {
            newCurations[existingIdx] = curation;
          } else {
            newCurations.push(...action.added);
          }
        }
      }

      return {
        ...state,
        curations: newCurations,
      };
    }
  }
}

type NewCurationStateInfo = {
  index: number;
  newCurations: CurationState[];
}

function genCurationState(folder: string, state: CurateState): NewCurationStateInfo {
  const index = state.curations.findIndex(curation => curation.folder === folder);
  const oldCuration = state.curations[index];
  const newCurations = [ ...state.curations ];
  newCurations[index] = {
    ...oldCuration
  };
  return {
    index,
    newCurations
  };
}

function createInitialState(): CurateState {
  return {
    curations: [],
    current: '',
  };
}
