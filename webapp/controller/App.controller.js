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
      console.log("save pressed");

      const oLocalModel = this.getView().getModel("local");
      const isCurrentlyInEditMode = oLocalModel.getProperty("/editMode");

      if (isCurrentlyInEditMode) {
        const oEventBus = sap.ui.getCore().getEventBus();

        // Create a callback to handle the validation result
        oEventBus.publish("App", "validateRows", (isValid) => {
          if (!isValid) {
            console.log("Validation failed");
            // Keep edit mode and return without saving
            return;
          } else {
            this._isEditMode = false;
            oLocalModel.setProperty("/editMode", this._isEditMode);

            const oTaskModel = this.getOwnerComponent().getModel("task");
            const aTasks = oTaskModel.getData().Tasks;

            localStorage.setItem("tasks", JSON.stringify(aTasks));
            console.log("Tasks saved to localStorage");

            oEventBus.publish("App", "toggleEditMode", {
              editMode: this._isEditMode,
            });
          }
        });
      }
    },
  });
});
