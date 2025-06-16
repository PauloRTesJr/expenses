import { TransactionsService } from "../lib/transactions/service";
import { createSupabaseMock } from "../tests/utils/supabaseMock";
import * as errors from "../lib/errors";

jest.mock("../lib/errors", () => ({ handleError: jest.fn() }));

var supabase: any;
var chain: any;

jest.mock("../lib/supabase/client", () => {
  const mock = require("../tests/utils/supabaseMock").createSupabaseMock();
  supabase = mock.supabase;
  chain = mock.chain;
  return { supabase };
});

describe("TransactionsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles fetch error", async () => {
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockResolvedValue({ data: null, error: new Error("fail") });
    supabase.from.mockReturnValue(chain);
    const spy = jest.spyOn(errors, "handleError");
    await expect(TransactionsService.fetchTransactionsWithShares("u1")).rejects.toThrow(
      "Erro ao buscar transações com compartilhamentos"
    );
    expect(spy).toHaveBeenCalledWith("fetchTransactionsWithShares", expect.any(Error));
  });
});
