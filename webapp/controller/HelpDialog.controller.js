sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("ui5.test.controller.HelpDialog", {
    onItemSelect(oEvent) {
      const oSelectedItem = oEvent
        .getSource()
        .getBindingContext("Customer")
        .getObject();
      const sSelectedKey = oSelectedItem.getTitle();

      const oInput = this.getView().byId("inputField");
      oInput.setValue(sSelectedKey);

      this.byId("helpDialog").close();
    },
  });
});
