sap.ui.define(["sap/ui/core/mvc/Controller"], (Controller) => {
  "use strict";

  return Controller.extend("ui5.test.controller.App", {
    onInit() {
      const oLocalModel = new sap.ui.model.json.JSONModel({ editMode: false });
      this.getView().setModel(oLocalModel, "local");
    },
    onExport() {
      const oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.publish("DataList", "exportData");
    },
    onEdit() {
      this._isEditMode = !this._isEditMode;

      const oLocalModel = this.getView().getModel("local");
      oLocalModel.setProperty("/editMode", this._isEditMode);

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
