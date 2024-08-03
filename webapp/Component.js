sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel",
  ],
  (UIComponent, JSONModel) => {
    "use strict";

    return UIComponent.extend("ui5.test.Component", {
      init() {
        UIComponent.prototype.init.apply(this, arguments);
        this.setModel(new sap.ui.model.json.JSONModel({ responsible: "" }));
        const oData = {
          columns: {
            taskName: true,
            taskType: true,
            responsible: true,
            startDate: true,
            endDate: true,
          },
        };

        const oModel = new JSONModel(oData);
        this.setModel(oModel);
      },
    });
  }
);
