sap.ui.define(["sap/ui/core/mvc/Controller"], (Controller) => {
  "use strict";

  return Controller.extend("ui5.test.controller.App", {
    onExport() {
      const oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.publish("DataList", "exportData");
    },
    onEdit() {
      this._isEditMode = !this._isEditMode;
      const oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.publish("App", "toggleEditMode", {
        editMode: this._isEditMode,
      });
      if (this._isEditMode) {
        console.log("Entering edit mode");
      } else {
        console.log("Exiting edit mode");
      }
    },
  });
});
