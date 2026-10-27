package expo.modules.asteralibraryaccess

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AsteraLibraryAccessModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AsteraLibraryAccess")

    Function("extractEntitiesAndTags") { _: String ->
      emptyList<String>()
    }
  }
}
