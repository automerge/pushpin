declare module '*.css' {
  interface CssModule {
    [className: string]: string
  }
  const classNames: CssModule
  export = classNames
}
