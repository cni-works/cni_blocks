param(
	[switch] $Force
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginFile = Join-Path $projectRoot 'cni_blocks.php'
$readmeFile = Join-Path $projectRoot 'readme.txt'
$releaseDirectory = Join-Path $projectRoot 'release'

$pluginContents = Get-Content -Raw -Encoding UTF8 -LiteralPath $pluginFile
$readmeContents = Get-Content -Raw -Encoding UTF8 -LiteralPath $readmeFile
$versionMatch = [regex]::Match($pluginContents, '(?m)^\s*\*\s*Version:\s*([^\s]+)\s*$')
$stableTagMatch = [regex]::Match($readmeContents, '(?m)^Stable tag:\s*([^\s]+)\s*$')

if (-not $versionMatch.Success) {
	throw 'Unable to read Version from cni_blocks.php.'
}

if (-not $stableTagMatch.Success) {
	throw 'Unable to read Stable tag from readme.txt.'
}

$version = $versionMatch.Groups[1].Value
$stableTag = $stableTagMatch.Groups[1].Value

if ($version -ne $stableTag) {
	throw "Version ($version) and Stable tag ($stableTag) do not match."
}

$zipName = "cni_blocks-$version.zip"
$destinationZip = Join-Path $releaseDirectory $zipName

if ((Test-Path -LiteralPath $destinationZip) -and -not $Force) {
	throw "A ZIP for this Version already exists: $destinationZip`nUse -Force only when replacement is intended."
}

$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("cni-blocks-release-" + [guid]::NewGuid().ToString('N'))
$packageRoot = Join-Path $temporaryRoot 'cni_blocks'
$candidateZip = Join-Path $temporaryRoot $zipName
$excludedRootNames = @(
	'.git',
	'release',
	'AGENTS.md',
	'PROJECT-BRIEF.md',
	'build-release.ps1',
	'.gitignore',
	'.gitattributes',
	'COPY-EXISTING-FILES-HERE.md',
	'desktop.ini'
)

try {
	New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null

	Get-ChildItem -LiteralPath $projectRoot -Force | Where-Object {
		$excludedRootNames -notcontains $_.Name
	} | ForEach-Object {
		Copy-Item -LiteralPath $_.FullName -Destination $packageRoot -Recurse -Force
	}

	Get-ChildItem -LiteralPath $packageRoot -Recurse -Force | Where-Object {
		$_.Name -eq 'desktop.ini' -or
		$_.Extension -eq '.zip' -or
		$_.Extension -eq '.bak' -or
		$_.Name.EndsWith('~')
	} | Remove-Item -Force

	Add-Type -AssemblyName System.IO.Compression
	Add-Type -AssemblyName System.IO.Compression.FileSystem
	$zipStream = [System.IO.File]::Open($candidateZip, [System.IO.FileMode]::CreateNew)
	try {
		$zipArchive = [System.IO.Compression.ZipArchive]::new(
			$zipStream,
			[System.IO.Compression.ZipArchiveMode]::Create,
			$false
		)
		try {
			Get-ChildItem -LiteralPath $packageRoot -Recurse -Force -File | ForEach-Object {
				$relativePath = $_.FullName.Substring($packageRoot.Length).TrimStart('\', '/')
				$entryName = 'cni_blocks/' + $relativePath.Replace('\', '/')
				[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
					$zipArchive,
					$_.FullName,
					$entryName,
					[System.IO.Compression.CompressionLevel]::Optimal
				) | Out-Null
			}
		} finally {
			if ($null -ne $zipArchive) {
				$zipArchive.Dispose()
			}
		}
	} finally {
		$zipStream.Dispose()
	}

	$archive = [System.IO.Compression.ZipFile]::OpenRead($candidateZip)
	try {
		$rawEntryNames = @($archive.Entries | ForEach-Object { $_.FullName })
		$entryNames = @($rawEntryNames | ForEach-Object { $_.Replace('\', '/') })
	} finally {
		$archive.Dispose()
	}

	$errors = [System.Collections.Generic.List[string]]::new()
	if ($entryNames.Count -eq 0) {
		$errors.Add('The ZIP is empty.')
	}
	if (@($rawEntryNames | Where-Object { $_.Contains('\') }).Count -gt 0) {
		$errors.Add('A ZIP entry contains a Windows backslash path separator.')
	}
	if (@($entryNames | Where-Object { -not $_.StartsWith('cni_blocks/') }).Count -gt 0) {
		$errors.Add('The top-level folder is not cni_blocks.')
	}
	if ($entryNames -notcontains 'cni_blocks/cni_blocks.php') {
		$errors.Add('cni_blocks.php is missing.')
	}
	if (@($entryNames | Where-Object { $_.StartsWith('cni_blocks/blocks/') }).Count -eq 0) {
		$errors.Add('The blocks folder is missing.')
	}
	if (@($entryNames | Where-Object { $_.StartsWith('cni_blocks/cni_blocks/') }).Count -gt 0) {
		$errors.Add('A duplicate cni_blocks/cni_blocks folder was found.')
	}

	$forbiddenPatterns = @(
		'(^|/)\.git(/|$)',
		'(^|/)AGENTS\.md$',
		'(^|/)PROJECT-BRIEF\.md$',
		'(^|/)build-release\.ps1$',
		'(^|/)release(/|$)',
		'(^|/)desktop\.ini$'
	)
	foreach ($pattern in $forbiddenPatterns) {
		if (@($entryNames | Where-Object { $_ -match $pattern }).Count -gt 0) {
			$errors.Add("A development-only file was found: $pattern")
		}
	}

	if ($errors.Count -gt 0) {
		Remove-Item -LiteralPath $candidateZip -Force -ErrorAction SilentlyContinue
		throw ("ZIP structure validation failed.`n- " + ($errors -join "`n- "))
	}

	New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
	[System.IO.File]::Copy($candidateZip, $destinationZip, $true)

	Write-Output "ZIP created: $destinationZip"
	Write-Output "Version: $version"
	Write-Output "Entry count: $($entryNames.Count)"
	Write-Output 'Structure validation: passed'
} finally {
	$resolvedTemporaryRoot = [System.IO.Path]::GetFullPath($temporaryRoot)
	$resolvedSystemTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
	if (
		$resolvedTemporaryRoot.StartsWith($resolvedSystemTemp, [System.StringComparison]::OrdinalIgnoreCase) -and
		(Split-Path -Leaf $resolvedTemporaryRoot).StartsWith('cni-blocks-release-', [System.StringComparison]::OrdinalIgnoreCase) -and
		(Test-Path -LiteralPath $resolvedTemporaryRoot)
	) {
		Remove-Item -LiteralPath $resolvedTemporaryRoot -Recurse -Force
	}
}
