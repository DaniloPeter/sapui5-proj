sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("ui5.test.controller.Home", {
    onInit() {
      const oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.subscribe("Home", "refreshData", this.onRefresh, this);
    },
    async onOpenDialog() {
      console.log("async"),
        (this.oDialog ??= await this.loadFragment({
          name: "ui5.test.view.HelpDialog",
        }));

      console.log("before open"), this.oDialog.open();
    },

    onCloseDialog() {
      console.log("before close"), this.byId("helpDialog").close();
    },

    onApplyFilter() {
      const responsibleValue = this.getView().byId("inputField").getValue();
      const taskTypeValue = this.getView().byId("typeSelect").getSelectedKey();
      const startDateValue = this.getView().byId("startDate").getValue();
      const endDateValue = this.getView().byId("endDate").getValue();

      const oModel = this.getOwnerComponent().getModel();
      oModel.setProperty("/responsible", responsibleValue);
      oModel.setProperty("/taskType", taskTypeValue);
      oModel.setProperty("/startDate", startDateValue);
      oModel.setProperty("/endDate", endDateValue);

      const oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.publish("DataList", "applyFilter", {
        responsible: responsibleValue,
        taskType: taskTypeValue,
        startDate: startDateValue,
        endDate: endDateValue,
      });
    },
    onItemSelect(oEvent) {
      console.log("selected");

      const sSelectedText = oEvent.getSource().getText();

      const oInput = this.getView().byId("inputField");
      oInput.setValue(sSelectedText);

      this.onCloseDialog();
    },
    onDateChange(oEvent) {
      const inputField = oEvent.getSource();
      let value = inputField.getValue();

      value = value.replace(/[^\d.]/g, "");

      if (value.length >= 2 && value.length < 3) {
        value = value.slice(0, 2) + ".";
      }
      if (value.length >= 5 && value.length < 6) {
        value = value.slice(0, 5) + ".";
      }
      if (value.length >= 10) {
        value = value.slice(0, 10);
      }

      inputField.setValue(value);
    },
    onClearFields() {
      const oInputField = this.getView().byId("inputField");
      const oStartDate = this.getView().byId("startDate");
      const oEndDate = this.getView().byId("endDate");
      const oTypeSelect = this.getView().byId("typeSelect");

      oInputField.setValue("");
      oStartDate.setValue("");
      oEndDate.setValue("");
      oTypeSelect.setSelectedKey("0");
    },
    onRefresh() {
      this.onClearFields();
      const oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.publish("DataList", "applyFilter", {
        responsible: "",
        taskType: "0",
        startDate: "",
        endDate: "",
      });
    },
  });
});
