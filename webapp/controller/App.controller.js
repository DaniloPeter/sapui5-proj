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
      this._isEditMode = true;
      console.log("edit mode pressed");

      const oLocalModel = this.getView().getModel("local");
      const isCurrentlyInEditMode = oLocalModel.getProperty("/editMode");
      if (!isCurrentlyInEditMode) {
        oLocalModel.setProperty("/editMode", true);

        const oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.publish("Home", "refreshData");
        oEventBus.publish("App", "toggleEditMode", {
          editMode: this._isEditMode,
        });

        console.log("Entering edit mode");
      }
    },
    onSave() {
      this._isEditMode = false;
      console.log("save pressed");

      const oLocalModel = this.getView().getModel("local");
      const isCurrentlyInEditMode = oLocalModel.getProperty("/editMode");
      if (isCurrentlyInEditMode) {
        oLocalModel.setProperty("/editMode", this._isEditMode);
        const oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.publish("App", "toggleEditMode", {
          editMode: this._isEditMode,
        });
      }
    },
  });
});
