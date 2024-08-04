sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
  ],
  (Controller, Filter, FilterOperator, JSONModel) => {
    "use strict";

    return Controller.extend("ui5.test.controller.DataList", {
      onInit() {
        const oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.subscribe(
          "App",
          "validateRows",
          this._validateAllRows.bind(this)
        );
        oEventBus.subscribe(
          "DataList",
          "applyFilter",
          this.onApplyFilter,
          this
        );
        oEventBus.subscribe("DataList", "exportData", this.onExportData, this);
        const oColumnVisibilityModel = new JSONModel({
          taskName: true,
          taskType: true,
          responsible: true,
          startDate: true,
          endDate: true,
        });
        oEventBus.subscribe(
          "App",
          "toggleEditMode",
          this.onToggleEditMode,
          this
        );

        const oList = this.byId("dataList");
        const aItems = oList.getItems();

        const oLocalModel = new JSONModel({ editMode: false });
        this.getView().setModel(oLocalModel, "local");

        const tasksData = localStorage.getItem("tasks");
        if (tasksData) {
          const oTaskModel = this.getOwnerComponent().getModel("task");
          const parsedTasks = JSON.parse(tasksData);
          oTaskModel.setProperty("/Tasks", parsedTasks);
          console.log("Tasks loaded from localStorage");
        }

        this._applyStringEdit(false);
        this._updateSettingsButtonState(false);
        this._updateAddDataButtonState(false);
        this.getView().setModel(oColumnVisibilityModel, "columnVisibility");
      },

      getI18n(key) {
        const oI18nModel = this.getOwnerComponent().getModel("i18n");
        return oI18nModel.getResourceBundle().getText(key);
      },

      onOpenResponsibleDialog(oEvent) {
        this._getResponsibleDialog().then((oDialog) => {
          this._selectedItemContext = oEvent
            .getSource()
            .getParent()
            .getBindingContext("task");
          oDialog.open();
        });
      },

      async _getResponsibleDialog() {
        if (!this.oResponsibleDialog) {
          this.oResponsibleDialog = await this.loadFragment({
            name: "ui5.test.view.ResponsibleDialog",
          });
        }
        return this.oResponsibleDialog;
      },

      onResponsibleSelect(oEvent) {
        const sSelectedResponsible = oEvent.getSource().getText();

        if (this._selectedItemContext) {
          const oModel = this.getView().getModel("task");
          const oContextPath = this._selectedItemContext.getPath();

          oModel.setProperty(
            oContextPath + "/responsible",
            sSelectedResponsible
          );

          this._getResponsibleDialog().then((oDialog) => {
            oDialog.close();

            const oList = this.byId("dataList");
            const aItems = oList.getItems();
            const oSource = aItems
              .find(
                (item) =>
                  item.getBindingContext("task").getPath() ===
                  this._selectedItemContext.getPath()
              )
              .getCells()[2]
              .getItems()[0];

            this.onResponsibleChange({
              getParameter: () => sSelectedResponsible,
              getSource: () => oSource,
            });
          });
        }
      },

      onResponsiblDialogClose() {
        if (this.oResponsibleDialog) {
          this.oResponsibleDialog.close();
        }
      },

      onDateChange(oEvent) {
        const inputField = oEvent.getSource();
        let value = inputField.getValue().trim();

        if (!value) {
          inputField.setValueState(sap.ui.core.ValueState.Error);
          inputField.setValueStateText("Дата не может быть пустой.");
          return;
        } else {
          inputField.setValueState(sap.ui.core.ValueState.None);
        }

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

        this._validateDate(value, inputField);
      },

      _validateDate(value, inputField) {
        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
        if (value && !datePattern.test(value)) {
          inputField.setValueState(sap.ui.core.ValueState.Error);
          inputField.setValueStateText("Некорректный формат даты.");
          return;
        }

        if (value) {
          const [day, month, year] = value.split(".").map(Number);

          if (month < 1 || month > 12) {
            inputField.setValueState(sap.ui.core.ValueState.Error);
            inputField.setValueStateText("Месяц должен быть от 1 до 12.");
            return;
          }

          const daysInMonth = [
            31,
            this._isLeapYear(year) ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
          ];

          if (day < 1 || day > daysInMonth[month - 1]) {
            inputField.setValueState(sap.ui.core.ValueState.Error);
            inputField.setValueStateText(
              `Некорректный день для месяца ${month}.`
            );
            return;
          }

          inputField.setValueState(sap.ui.core.ValueState.None);
        }
      },

      _isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      },

      onToggleEditMode(sChannel, sEvent, oData) {
        const isEditMode = oData.editMode;
        this._updateSettingsButtonState(isEditMode);
        this._updateAddDataButtonState(isEditMode);
        this._applyStringEdit(isEditMode);

        if (isEditMode) {
          const oColumnVisibilityModel =
            this.getView().getModel("columnVisibility");
          oColumnVisibilityModel.setData({
            taskName: true,
            taskType: true,
            responsible: true,
            startDate: true,
            endDate: true,
          });
        }

        this._applyColumnVisibility();
      },

      _applyColumnVisibility() {
        const oColumnVisibilityModel =
          this.getView().getModel("columnVisibility");
        const aColumns = [
          {
            name: "taskName",
            visible: oColumnVisibilityModel.getProperty("/taskName"),
          },
          {
            name: "taskType",
            visible: oColumnVisibilityModel.getProperty("/taskType"),
          },
          {
            name: "responsible",
            visible: oColumnVisibilityModel.getProperty("/responsible"),
          },
          {
            name: "startDate",
            visible: oColumnVisibilityModel.getProperty("/startDate"),
          },
          {
            name: "endDate",
            visible: oColumnVisibilityModel.getProperty("/endDate"),
          },
        ];

        const oList = this.byId("dataList");
        const aTableColumns = oList.getColumns();

        aColumns.forEach((col) => {
          const oColumn = aTableColumns.find(
            (c) => c.getHeader().getText() === this.getI18n(col.name)
          );
          if (oColumn) {
            oColumn.setVisible(col.visible);
          }
        });
      },

      async onSettings() {
        console.log("async"),
          (this.oDialog ??= await this.loadFragment({
            name: "ui5.test.view.SettingsDialog",
          }));

        console.log("before open"), this.oDialog.open();
      },

      _applyStringEdit(isEditMode) {
        const oList = this.byId("dataList");
        const aItems = oList.getItems();
        aItems.forEach((item) => {
          const inputCells = item.getCells();

          const taskNameCell = inputCells[0];
          const taskTypeCell = inputCells[1];
          const responsibleHBox = inputCells[2];
          const responsibleInput = responsibleHBox.getItems()[0];
          const responsibleButton = responsibleHBox.getItems()[1];
          const startDateCell = inputCells[3];
          const endDateCell = inputCells[4];

          taskNameCell.setEditable(isEditMode);
          taskTypeCell.setEditable(isEditMode);
          responsibleInput.setEditable(isEditMode);
          startDateCell.setEditable(isEditMode);
          endDateCell.setEditable(isEditMode);
          responsibleButton.setEnabled(isEditMode);
        });
      },

      _updateSettingsButtonState(isEditMode) {
        const oSettingsButton = this.byId("settingsButton");
        if (oSettingsButton) {
          oSettingsButton.setEnabled(!isEditMode);
        }
      },

      _updateAddDataButtonState(isEditMode) {
        const oAddDataButton = this.byId("addDataButton");
        if (oAddDataButton) {
          oAddDataButton.setEnabled(isEditMode);
        }
      },

      onDialogClose() {
        const oModel = this.getView().getModel("columnVisibility");
        this._applyColumnVisibility();

        console.log("before close"), this.byId("settingsDialog").close();
      },

      onApplyFilter(oData) {
        this.applyResponsibleFilter(oData);
      },

      applyResponsibleFilter(oData) {
        const aFilter = [];
        if (oData.responsible) {
          aFilter.push(
            new Filter(
              "responsible",
              FilterOperator.Contains,
              oData.responsible
            )
          );
        }

        if (oData.taskType && oData.taskType !== "0") {
          aFilter.push(
            new Filter("taskType", FilterOperator.Contains, oData.taskType)
          );
        }
        if (oData.startDate) {
          aFilter.push(
            new Filter("startDate", FilterOperator.Contains, oData.startDate)
          );
        }

        if (oData.endDate) {
          aFilter.push(
            new Filter("endDate", FilterOperator.Contains, oData.endDate)
          );
        }

        const oList = this.byId("dataList");
        const oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);
      },

      onTaskNameChange(oEvent) {
        const sNewTaskName = oEvent.getParameter("value");
        const oSource = oEvent.getSource();
        const oItem = oSource.getParent();
        const oContext = oItem.getBindingContext("task");

        if (sNewTaskName.trim() === "") {
          oSource.setValueState(sap.ui.core.ValueState.Error);
          oSource.setValueStateText("Название задания не может быть пустым.");
        } else {
          const oModel = this.getView().getModel("task");
          oModel.setProperty("taskName", sNewTaskName, oContext);
          oSource.setValueState(sap.ui.core.ValueState.None);
        }
      },

      onTaskTypeChange(oEvent) {
        const sSelectedTaskType = oEvent.getParameter("selectedItem")?.getKey();
        if (!sSelectedTaskType) {
          oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
          oEvent
            .getSource()
            .setValueStateText("Тип задания должен быть выбран.");
        } else {
          const oSource = oEvent.getSource();
          const oItem = oSource.getParent();
          const oContext = oItem.getBindingContext("task");

          const oModel = this.getView().getModel("task");
          oModel.setProperty("taskType", sSelectedTaskType, oContext);
          oSource.setValueState(sap.ui.core.ValueState.None);
        }
      },
      onResponsibleChange(oEvent) {
        const sNewResponsible = oEvent.getParameter("value");
        const oSource = oEvent.getSource();
        const oItem = oSource.getParent();
        const oContext = oItem.getBindingContext("task");

        if (sNewResponsible.trim() === "") {
          oSource.setValueState(sap.ui.core.ValueState.Error);
          oSource.setValueStateText("значение не может быть пустым.");
        } else {
          const oModel = this.getView().getModel("task");
          oModel.setProperty("responsible", sNewResponsible, oContext);
          oSource.setValueState(sap.ui.core.ValueState.None);
        }
      },

      onExportData() {
        const oList = this.byId("dataList");
        const oBinding = oList.getBinding("items");
        const aFilteredData = oBinding
          .getCurrentContexts()
          .map((ctx) => ctx.getObject());

        const header = [
          "Task Name",
          "Task Type",
          "Responsible",
          "Start Date",
          "End Date",
        ];
        let csv = "\uFEFF";
        csv += header.join(";") + "\n";

        aFilteredData.forEach((item) => {
          csv += `"${item.taskName}";"${item.taskType}";"${item.responsible}";"${item.startDate}";"${item.endDate}"\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "exported_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      onApplyFilter(sChannel, sEvent, oData) {
        this.applyResponsibleFilter(oData);
      },

      onExit() {
        const oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.unsubscribe(
          "DataList",
          "applyFilter",
          this.onApplyFilter,
          this
        );
        oEventBus.unsubscribe(
          "DataList",
          "exportData",
          this.onExportData,
          this
        );
      },

      onFilterData(oEvent) {
        const aFilter = [];
        const sQuery = oEvent.getParameter("query");
        if (sQuery) {
          aFilter.push(new Filter("taskName", FilterOperator.Contains, sQuery));
        }

        const oList = this.byId("dataList");
        const oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);
      },

      onAddData() {
        const oModel = this.getView().getModel("task");
        const aData = oModel.getData().Tasks;

        const newItem = {
          taskName: "",
          taskType: "0",
          responsible: "",
          startDate: this._getCurrentDate(),
          endDate: "",
        };

        aData.unshift(newItem);

        oModel.setProperty("/Tasks", aData);
        this._applyStringEdit(true);
      },
      _getCurrentDate() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();

        return `${day}.${month}.${year}`;
      },
      _validateAllRows(sChannel, sEvent, fnCallback) {
        const oList = this.byId("dataList");
        const aItems = oList.getItems();
        let isValid = true;

        aItems.forEach((item, index) => {
          const oContext = item.getBindingContext("task");
          const taskData = this.getView()
            .getModel("task")
            .getProperty(oContext.getPath());

          const createChangeEvent = (name, value, cell) => ({
            getParameter: () => value,
            getSource: () => cell,
            getBindingContext: () => oContext,
          });

          this.onTaskNameChange(
            createChangeEvent("taskName", taskData.taskName, item.getCells()[0])
          );

          this.onResponsibleChange(
            createChangeEvent(
              "responsible",
              taskData.responsible,
              item.getCells()[2].getItems()[0]
            )
          );

          const startDateInput = item.getCells()[3];
          const endDateInput = item.getCells()[4];

          this.onDateChange(
            createChangeEvent("startDate", taskData.startDate, startDateInput)
          );

          this.onDateChange(
            createChangeEvent("endDate", taskData.endDate, endDateInput)
          );

          const startDateValue = startDateInput.getValue();
          const endDateValue = endDateInput.getValue();

          const parseDate = (dateStr) => {
            const parts = dateStr.split(".");
            if (parts.length !== 3) return null;
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            return { day, month, year };
          };

          const startDate = parseDate(startDateValue);
          const endDate = parseDate(endDateValue);

          if (
            !endDate ||
            !startDate ||
            endDate.year < startDate.year ||
            (endDate.year === startDate.year &&
              endDate.month < startDate.month) ||
            (endDate.year === startDate.year &&
              endDate.month === startDate.month &&
              endDate.day < startDate.day)
          ) {
            endDateInput.setValueState(sap.ui.core.ValueState.Error);
          } else {
            startDateInput.setValueState(sap.ui.core.ValueState.None);
          }

          if (
            endDateInput.getValueState() === sap.ui.core.ValueState.Error ||
            startDateInput.getValueState() === sap.ui.core.ValueState.Error ||
            item.getCells()[0].getValueState() ===
              sap.ui.core.ValueState.Error ||
            item.getCells()[2].getItems()[0].getValueState() ===
              sap.ui.core.ValueState.Error
          ) {
            isValid = false;
          }
        });

        if (typeof fnCallback === "function") {
          fnCallback(isValid);
        }
      },
    });
  }
);
