import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

function setupAuth(loginResult: string | null = null) {
  const login = jest.fn().mockResolvedValue(loginResult);
  const register = jest.fn().mockResolvedValue(null);
  mockUseAuth.mockReturnValue({ user: null, loading: false, login, register });
  return { login, register };
}

describe("AuthForm", () => {
  it("submits the email and password to login", async () => {
    const user = userEvent.setup();
    const { login } = setupAuth();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "me@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(login).toHaveBeenCalledWith("me@example.com", "password123");
  });

  it("shows the error message when login fails", async () => {
    const user = userEvent.setup();
    setupAuth("Invalid email or password");
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "me@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("calls register in register mode", async () => {
    const user = userEvent.setup();
    const { login, register } = setupAuth();
    render(<AuthForm mode="register" />);

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(register).toHaveBeenCalledWith("new@example.com", "password123");
    expect(login).not.toHaveBeenCalled();
  });
});