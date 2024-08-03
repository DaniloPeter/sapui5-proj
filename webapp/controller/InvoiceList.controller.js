sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  (Controller, JSONModel, formatter, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("ui5.test.controller.InvoiceList", {
      onInit() {
        const oModel = this.getView().getModel("invoice");

        if (!oModel.getProperty("/Invoices")) {
          oModel.setProperty("/Invoices", []);
        }
      },

      onAddInvoice() {
        const oModel = this.getView().getModel("invoice");

        const aInvoices = oModel.getProperty("/Invoices");

        const oNewInvoice = {
          taskName: "",
          taskType: "",
          responsible: "",
          startDate: this._getCurrentDate(),
          endDate: "",
        };

        aInvoices.unshift(oNewInvoice);
        oModel.setProperty("/Invoices", aInvoices);

        console.log("Invoice added successfully.");
      },

      onFilterInvoices(oEvent) {
        const aFilter = [];
        const sQuery = oEvent.getParameter("query");
        if (sQuery) {
          aFilter.push(new Filter("taskName", FilterOperator.Contains, sQuery));
        }

        const oTable = this.byId("invoiceTable");
        const oBinding = oTable.getBinding("items");
        oBinding.filter(aFilter);
      },

      _getCurrentDate() {
        const oDate = new Date();
        const day = String(oDate.getDate()).padStart(2, "0");
        const month = String(oDate.getMonth() + 1).padStart(2, "0");
        const year = oDate.getFullYear();
        return `${day}.${month}.${year}`;
      },
    });
  }
);
