import { DesignerState } from "../farm_designer/interfaces";

export const fakeDesignerState = (): DesignerState => ({
  selectedPoints: undefined,
  selectionPointType: undefined,
  hoveredPlant: {
    plantUUID: undefined,
    icon: ""
  },
  hoveredPoint: undefined,
  hoveredPlantListItem: undefined,
  hoveredToolSlot: undefined,
  cropSearchQuery: "",
  cropSearchResults: [],
  cropSearchInProgress: false,
  chosenLocation: { x: undefined, y: undefined, z: undefined },
  drawnPoint: undefined,
  drawnWeed: undefined,
  openedSavedGarden: undefined,
  tryGroupSortType: undefined,
  editGroupAreaInMap: false,
  visualizedSequence: undefined,
  hoveredSequenceStep: undefined,
  settingsSearchTerm: "",
  hiddenImages: [],
  hoveredMapImage: undefined,
  cameraViewGridId: undefined,
});
