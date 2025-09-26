export const listExpenses = async (api, date = null) => {
  const params = date ? { date } : {};
  const response = await api.get("http://localhost:8000/api/entries/budget/", {
    params,
  });
  return response.data.streams;
};

export const deleteExpenseStream = async (api, id) => {
  const response = await api.delete(
    "http://localhost:8000/api/entries/expense-stream/",
    {
      data: { id },
    },
  );
  return response.data.streams;
};

export const deleteIncomeStream = async (api, id) => {
  const response = await api.delete(
    "http://localhost:8000/api/entries/income-stream/",
    {
      data: { id },
    },
  );

  return response.data.streams;
};

export const createExpenseStream = async (api, expenseData) => {
  const response = await api.post(
    "http://localhost:8000/api/entries/expense-stream/",
    expenseData,
  );
  return response.data;
};

export const updateExpenseStream = async (api, id, expenseData) => {
  const response = await api.put(
    "http://localhost:8000/api/entries/expense-stream/",
    { id, ...expenseData },
  );
  return response.data;
};

export const createIncomeStream = async (api, incomeData) => {
  const response = await api.post(
    "http://localhost:8000/api/entries/income-stream/",
    incomeData,
  );
  return response.data;
};

export const updateIncomeStream = async (api, id, incomeData) => {
  const response = await api.put(
    "http://localhost:8000/api/entries/income-stream/",
    { id, ...incomeData },
  );
  return response.data;
};
