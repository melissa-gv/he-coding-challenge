const LOCAL_HOSTS = new Set<string>(['localhost', '127.0.0.1']);

function resolveApiPrefix(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000/api';
  }

  return LOCAL_HOSTS.has(window.location.hostname) ? 'http://localhost:8000/api' : '/api';
}

export const API_PREFIX = resolveApiPrefix();
