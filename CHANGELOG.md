## [1.7.2-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.7.1...v1.7.2-release.1) (2023-06-02)


### Bug Fixes

* new wappler version conflicts with ioredis ([4c36ea0](https://github.com/tbvgl/wappler-bull-queues/commit/4c36ea0164eed07933c1113be20a436c28cecd45))

## [1.7.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.7.0...v1.7.1) (2023-06-02)


### Bug Fixes

* global socket ([a51d5d1](https://github.com/tbvgl/wappler-bull-queues/commit/a51d5d1cdf26a10b38eaa809f7da0e5947d0bfb2))

## [1.7.1-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.7.0...v1.7.1-release.1) (2023-06-02)


### Bug Fixes

* global socket ([a51d5d1](https://github.com/tbvgl/wappler-bull-queues/commit/a51d5d1cdf26a10b38eaa809f7da0e5947d0bfb2))

# [1.7.0](https://github.com/tbvgl/wappler-bull-queues/compare/v1.6.0...v1.7.0) (2023-06-01)


### Features

* Close db connection after sandboxed job ([aee996f](https://github.com/tbvgl/wappler-bull-queues/commit/aee996f5b9037e664345596d32ab1821a0d86026))

# [1.6.0-release.2](https://github.com/tbvgl/wappler-bull-queues/compare/v1.6.0-release.1...v1.6.0-release.2) (2023-06-01)


### Features

* Close db connection after sandboxed job ([aee996f](https://github.com/tbvgl/wappler-bull-queues/commit/aee996f5b9037e664345596d32ab1821a0d86026))

# [1.6.0-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.5.2...v1.6.0-release.1) (2023-05-22)


### Bug Fixes

* hjson formatting error ([687d15c](https://github.com/tbvgl/wappler-bull-queues/commit/687d15c51d401ea913b9ef6578a736c466758ff7))


### Features

* Allow socket events in bull jobs ([8a9766b](https://github.com/tbvgl/wappler-bull-queues/commit/8a9766b8363562176f4f8c76b98b6079a75bb605))

## [1.5.2](https://github.com/tbvgl/wappler-bull-queues/compare/v1.5.1...v1.5.2) (2023-05-20)


### Bug Fixes

* hjson formatting error ([231224d](https://github.com/tbvgl/wappler-bull-queues/commit/231224dbaf79067f907bc7d99dcc398a33571a7c))

## [1.5.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.5.0...v1.5.1) (2023-05-19)


### Bug Fixes

* version ([4bf753e](https://github.com/tbvgl/wappler-bull-queues/commit/4bf753eeb7115cf6a89a1c407467c0e59e414555))

## [1.5.1-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.5.0...v1.5.1-release.1) (2023-05-19)


### Bug Fixes

* version ([4bf753e](https://github.com/tbvgl/wappler-bull-queues/commit/4bf753eeb7115cf6a89a1c407467c0e59e414555))

# [1.5.0](https://github.com/tbvgl/wappler-bull-queues/compare/v1.4.2...v1.5.0) (2023-05-19)


### Bug Fixes

* auto-start not updating if queue already exists ([5eaa390](https://github.com/tbvgl/wappler-bull-queues/commit/5eaa390683508015ea8b199b3ec838f41c6c99c4))


### Features

*  Auto-starting queues ([5237ac8](https://github.com/tbvgl/wappler-bull-queues/commit/5237ac899151c00ea372df9a2adb101610d37410))
* Backoff strategy ([18ce266](https://github.com/tbvgl/wappler-bull-queues/commit/18ce266b7f40353a5934c82f879baadc693a0fbe))
* Forward headers and session ([69789a4](https://github.com/tbvgl/wappler-bull-queues/commit/69789a4c6e21d3b1778c7e6be463560761a74fd5))
* Forward headers and sessions to job processes ([3baba22](https://github.com/tbvgl/wappler-bull-queues/commit/3baba22bee68cffa17c1440bd05286482ab285fd))
* Remove auto-starting queue from list if queue is recreated with autoStart = false ([d1cc032](https://github.com/tbvgl/wappler-bull-queues/commit/d1cc032000ec6e9b3cedee30d772a58cfaed84c0))
* session and header forwarding & auto-starting queues ([65729ce](https://github.com/tbvgl/wappler-bull-queues/commit/65729ceaa7b4569fcee589207d5dfa86a56d4617))

# [1.5.0-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.4.2...v1.5.0-release.1) (2023-05-19)


### Bug Fixes

* auto-start not updating if queue already exists ([5eaa390](https://github.com/tbvgl/wappler-bull-queues/commit/5eaa390683508015ea8b199b3ec838f41c6c99c4))


### Features

*  Auto-starting queues ([5237ac8](https://github.com/tbvgl/wappler-bull-queues/commit/5237ac899151c00ea372df9a2adb101610d37410))
* Backoff strategy ([18ce266](https://github.com/tbvgl/wappler-bull-queues/commit/18ce266b7f40353a5934c82f879baadc693a0fbe))
* Forward headers and session ([69789a4](https://github.com/tbvgl/wappler-bull-queues/commit/69789a4c6e21d3b1778c7e6be463560761a74fd5))
* Forward headers and sessions to job processes ([3baba22](https://github.com/tbvgl/wappler-bull-queues/commit/3baba22bee68cffa17c1440bd05286482ab285fd))
* Remove auto-starting queue from list if queue is recreated with autoStart = false ([d1cc032](https://github.com/tbvgl/wappler-bull-queues/commit/d1cc032000ec6e9b3cedee30d772a58cfaed84c0))
* session and header forwarding & auto-starting queues ([65729ce](https://github.com/tbvgl/wappler-bull-queues/commit/65729ceaa7b4569fcee589207d5dfa86a56d4617))

## [1.4.2](https://github.com/tbvgl/wappler-bull-queues/compare/v1.4.1...v1.4.2) (2023-05-16)


### Bug Fixes

* automatic installation fails if nested extension ([5b803c8](https://github.com/tbvgl/wappler-bull-queues/commit/5b803c8e4882b63712f0bf16f28e63fac6b191b6))

## [1.4.2-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.4.1...v1.4.2-release.1) (2023-05-16)


### Bug Fixes

* automatic installation fails if nested extension ([5b803c8](https://github.com/tbvgl/wappler-bull-queues/commit/5b803c8e4882b63712f0bf16f28e63fac6b191b6))

## [1.4.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.4.0...v1.4.1) (2023-05-16)


### Bug Fixes

* automatic installation ([7732899](https://github.com/tbvgl/wappler-bull-queues/commit/7732899f1ed6a18520327b29f84351811c66e1d6))
* folder creation fails if it exists ([285a886](https://github.com/tbvgl/wappler-bull-queues/commit/285a88615882972cfdaf5dbadf99d676be61e552))

## [1.4.1-release.2](https://github.com/tbvgl/wappler-bull-queues/compare/v1.4.1-release.1...v1.4.1-release.2) (2023-05-16)


### Bug Fixes

* automatic installation ([7732899](https://github.com/tbvgl/wappler-bull-queues/commit/7732899f1ed6a18520327b29f84351811c66e1d6))

## [1.4.1-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.4.0...v1.4.1-release.1) (2023-05-16)


### Bug Fixes

* folder creation fails if it exists ([285a886](https://github.com/tbvgl/wappler-bull-queues/commit/285a88615882972cfdaf5dbadf99d676be61e552))

# [1.4.0](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.3...v1.4.0) (2023-05-16)


### Features

* automatic installation ([d16bfd9](https://github.com/tbvgl/wappler-bull-queues/commit/d16bfd95f856fb922935af8bc6df4e8edf4a8fa2))

# [1.4.0-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.3...v1.4.0-release.1) (2023-05-16)


### Features

* automatic installation ([d16bfd9](https://github.com/tbvgl/wappler-bull-queues/commit/d16bfd95f856fb922935af8bc6df4e8edf4a8fa2))

## [1.3.3](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.2...v1.3.3) (2023-05-16)


### Bug Fixes

* logger imports in preparation for new Wappler release ([b083b5f](https://github.com/tbvgl/wappler-bull-queues/commit/b083b5f7c82b2f56ed9646a3b911a188dfcb87c0))

## [1.3.3-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.2...v1.3.3-release.1) (2023-05-16)


### Bug Fixes

* logger imports in preparation for new Wappler release ([b083b5f](https://github.com/tbvgl/wappler-bull-queues/commit/b083b5f7c82b2f56ed9646a3b911a188dfcb87c0))

## [1.3.2](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.1...v1.3.2) (2023-05-16)


### Bug Fixes

* wrong logger import for upcoming Wappler version ([53f3632](https://github.com/tbvgl/wappler-bull-queues/commit/53f3632f41599e8a6712ae54bb2266db4d32f265))

## [1.3.2-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.1...v1.3.2-release.1) (2023-05-16)


### Bug Fixes

* wrong logger import for upcoming Wappler version ([53f3632](https://github.com/tbvgl/wappler-bull-queues/commit/53f3632f41599e8a6712ae54bb2266db4d32f265))

## [1.3.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.0...v1.3.1) (2023-05-16)


### Bug Fixes

* legacy wappler imports ([fae9cb9](https://github.com/tbvgl/wappler-bull-queues/commit/fae9cb9b8eb149556f55510efe21825315e3f240))

## [1.3.1-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.3.0...v1.3.1-release.1) (2023-05-16)


### Bug Fixes

* legacy wappler imports ([fae9cb9](https://github.com/tbvgl/wappler-bull-queues/commit/fae9cb9b8eb149556f55510efe21825315e3f240))

# [1.3.0](https://github.com/tbvgl/wappler-bull-queues/compare/v1.2.0...v1.3.0) (2023-05-16)


### Features

* logging ([0c007ec](https://github.com/tbvgl/wappler-bull-queues/commit/0c007ec94d0b403bc8115f562e7a8fc7dc0b184a))

# [1.3.0-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.2.0...v1.3.0-release.1) (2023-05-16)


### Features

* logging ([0c007ec](https://github.com/tbvgl/wappler-bull-queues/commit/0c007ec94d0b403bc8115f562e7a8fc7dc0b184a))

# [1.2.0](https://github.com/tbvgl/wappler-bull-queues/compare/v1.1.0...v1.2.0) (2023-05-15)


### Features

* ci ([7b6559d](https://github.com/tbvgl/wappler-bull-queues/commit/7b6559d0f02a43b62b130ac0eedf5be75bddd253))

# [1.2.0-release.1](https://github.com/tbvgl/wappler-bull-queues/compare/v1.1.0...v1.2.0-release.1) (2023-05-15)


### Features

* ci ([7b6559d](https://github.com/tbvgl/wappler-bull-queues/commit/7b6559d0f02a43b62b130ac0eedf5be75bddd253))

# [1.1.0](https://github.com/tbvgl/wappler-bull-queues/compare/v1.0.0...v1.1.0) (2023-05-15)


### Features

* ci ([ee623be](https://github.com/tbvgl/wappler-bull-queues/commit/ee623be946fb2a878f8217623380d021a2adcbd4))
