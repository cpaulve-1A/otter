import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getFilesFromRootOfWorkspaceProjects } from '../../utility';
import { listOfExposedElements, SassImportExposedElement } from './list-of-vars';

const imports = new RegExp(/^@import\s+['"]~?@(o3r|otter)\/styling.*\s*/, 'gm');

/**
 * Update SASS imports to use a scoped dependency
 *
 * @param alias The name of the otter styling package
 * @param dependencyName The name of the dependency to update imports on
 * @param exposedElements The list of exposed elemeents
 */
export function updateSassImports(alias: string, dependencyName = '@o3r/styling', exposedElements: SassImportExposedElement[] = listOfExposedElements): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const files = getFilesFromRootOfWorkspaceProjects(tree, 'scss');
    files
      .forEach((file) => {
        let content = tree.read(file)!.toString();
        if (content.match(imports)) {
          const contentWithoutImports = content.replace(imports, '');
          content = `@use '${dependencyName}' as ${alias};\n${contentWithoutImports}`;
          exposedElements.forEach(elem => {
            const elemRegex = new RegExp(`(?<![\\w\\d-])${elem.type === 'var' ? '\\' : ''}${elem.value}((?![\\w\\d-])(?!(\\s*\\:)))`, 'g');
            content = content.replace(elemRegex, `${alias}.${(elem.replacement || elem.value)}`);
          });
          tree.overwrite(file, content);
        }
      });

    return tree;
  };
}