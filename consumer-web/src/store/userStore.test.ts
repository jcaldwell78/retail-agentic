import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUserStore } from './userStore';
import type { User } from '@/lib/api';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

const mockToken = 'test-token-123';

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should initialize with null user and not authenticated', () => {
    const { result } = renderHook(() => useUserStore());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should provide all required actions', () => {
    const { result } = renderHook(() => useUserStore());

    expect(typeof result.current.setUser).toBe('function');
    expect(typeof result.current.setToken).toBe('function');
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.updateUser).toBe('function');
  });
});

describe('useUserStore - setUser', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should set user', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should set isAuthenticated to true when user is set', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should set isAuthenticated to false when user is null', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser(mockUser);
      result.current.setUser(null);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('useUserStore - setToken', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should set token', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setToken(mockToken);
    });

    expect(result.current.token).toBe(mockToken);
  });

  it('should not affect user or isAuthenticated', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setToken(mockToken);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('useUserStore - login', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should set user and token on login', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
  });

  it('should set isAuthenticated to true on login', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should update existing session on login', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    const newUser: User = {
      ...mockUser,
      firstName: 'Updated',
    };
    const newToken = 'new-token';

    act(() => {
      result.current.login(newUser, newToken);
    });

    expect(result.current.user).toEqual(newUser);
    expect(result.current.token).toBe(newToken);
  });
});

describe('useUserStore - logout', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.login(mockUser, mockToken);
    });
  });

  it('should clear user on logout', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it('should clear token on logout', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
  });

  it('should set isAuthenticated to false on logout', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('useUserStore - updateUser', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.login(mockUser, mockToken);
    });
  });

  it('should update user with partial data', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.updateUser({ firstName: 'Updated' });
    });

    expect(result.current.user?.firstName).toBe('Updated');
    expect(result.current.user?.lastName).toBe('User');
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('should update multiple fields', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.updateUser({
        firstName: 'Updated',
        lastName: 'Name',
      });
    });

    expect(result.current.user?.firstName).toBe('Updated');
    expect(result.current.user?.lastName).toBe('Name');
  });

  it('should not update when user is null', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.logout();
      result.current.updateUser({ firstName: 'Updated' });
    });

    expect(result.current.user).toBeNull();
  });

  it('should maintain token and isAuthenticated when updating user', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.updateUser({ firstName: 'Updated' });
    });

    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe('useUserStore - Complex Scenarios', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should handle multiple operations in sequence', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser(mockUser);
      result.current.setToken(mockToken);
      result.current.updateUser({ firstName: 'Updated' });
    });

    expect(result.current.user?.firstName).toBe('Updated');
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle login and logout cycle', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('should handle login with different users', () => {
    const { result } = renderHook(() => useUserStore());

    const user1: User = {
      id: '1',
      email: 'user1@example.com',
      firstName: 'User',
      lastName: 'One',
    };

    const user2: User = {
      id: '2',
      email: 'user2@example.com',
      firstName: 'User',
      lastName: 'Two',
    };

    act(() => {
      result.current.login(user1, 'token1');
    });

    expect(result.current.user?.id).toBe('1');

    act(() => {
      result.current.login(user2, 'token2');
    });

    expect(result.current.user?.id).toBe('2');
    expect(result.current.token).toBe('token2');
  });

  it('should maintain user state across multiple hook calls', () => {
    const { result: result1 } = renderHook(() => useUserStore());

    act(() => {
      result1.current.login(mockUser, mockToken);
    });

    const { result: result2 } = renderHook(() => useUserStore());

    expect(result2.current.user).toEqual(mockUser);
    expect(result2.current.token).toBe(mockToken);
    expect(result2.current.isAuthenticated).toBe(true);
  });
});

describe('useUserStore - Edge Cases', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should handle setting empty user object', () => {
    const { result } = renderHook(() => useUserStore());

    const emptyUser: User = {
      id: '',
      email: '',
      firstName: '',
      lastName: '',
    };

    act(() => {
      result.current.setUser(emptyUser);
    });

    expect(result.current.user).toEqual(emptyUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle setting empty token', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setToken('');
    });

    expect(result.current.token).toBe('');
  });

  it('should handle multiple consecutive updates', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.login(mockUser, mockToken);
      result.current.updateUser({ firstName: 'First' });
      result.current.updateUser({ lastName: 'Second' });
      result.current.updateUser({ email: 'new@example.com' });
    });

    expect(result.current.user?.firstName).toBe('First');
    expect(result.current.user?.lastName).toBe('Second');
    expect(result.current.user?.email).toBe('new@example.com');
  });
});
