const chalk = require('chalk');
const columnify = require('columnify');

const timeStamp = () => {
  let time = new Date();
  return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
};

module.exports = {

  title: {

    io: ({ columns }) => {
      return `${chalk.dim.gray(' '.repeat(columns))}\n${chalk.dim.gray('|'.repeat(columns))}`;
    },


    pm2: ({ rows, columns }) => {
      let title = 'Process List';
      return `${chalk.gray(' '.repeat(columns))}\n${chalk.gray('~'.repeat(columns))}\n * ${title.toUpperCase()} *\n${chalk.gray('_'.repeat(columns))}\n${chalk.gray('|/')}\n`;
    },

    webpack: ({ rows, columns }) => {
      let title = 'Bundle List';
      return `${chalk.gray(' '.repeat(columns))}\n${chalk.gray('~'.repeat(columns))}\n * ${title.toUpperCase()} *\n${chalk.gray('_'.repeat(columns))}\n${chalk.gray('|/')}\n`;
    },

  },

  status: {

    webpack: ({ name, type, item, columns, rows }) => {

      let { percentage, message } = item.status;

      percentage = +percentage;

      let titleLength = name.length + 5;

      if(titleLength < 20) titleLength = 20;
      let dividerLength = titleLength - 1;

      let divider = chalk.gray(`${'|\\'}${'_'.repeat(dividerLength)}`);
      let title = `${chalk.gray('|')}  ${percentage === 1 ? chalk.underline.cyan(name) : chalk.underline.dim.yellow(name)}${' '.repeat(titleLength - (name.length + 4))}`;

      let header = `${divider}\n${title}`;


      let buildStatus = '';
      let buildMessage = '';

      // Define build status
      if(percentage !== 1) {

        // TODO: don't hard code these lengths
        let barPrefixLength = 13;
        let barPostfixLength = 7;

        let barProgress = `${(percentage * 100).toFixed(0)}${chalk.gray('%')}`;

        let barPrefix = `${chalk.gray('|')} ${chalk.red('building')} [`;
        let barPostfix = `] ${chalk.gray('~') } ${barProgress}`;
        let barLength =  columns - (titleLength + barPrefixLength + barPostfixLength);

        let barFull = Math.floor(barLength * percentage);
        let barEmpty = barLength - (barFull + 1);

        let barFullChars = '='.repeat(barFull) + (barEmpty ? '>' : '');
        let barEmptyChars = barEmpty >= 0 ? '~'.repeat(barEmpty) : '';

        buildStatus = `${barPrefix}${chalk.bold.blue(barFullChars)}${chalk.dim.gray(barEmptyChars)}${barPostfix}\n`;
        buildMessage += `${chalk.gray('\\' + '_'.repeat(titleLength - 2) + '|$>') } ${chalk.cyan(message)}\n`;

      } else {
        buildStatus = `${chalk.gray('|')} ${chalk.green('ready')} [${chalk.blue(timeStamp())}]\n`;
        buildMessage += `${chalk.gray('\\' + '_'.repeat(titleLength - 2) + '|$>') } ${chalk.gray('watching for changes')}\n`;
      }


      return `${header}${buildStatus}${buildMessage}`;

    },

    pm2: ({ name, type, item, columns, rows }) => {

      let proc = item.status;

      let data = {};

      for(let i = 0; i < proc.length; i++) {

        let p = proc[i];
        let item = {};

        // item.name = p.name;
        item.id = p.pm_id;
        item.pid = p.pid;
        item.status = p.pm2_env.status;

        if(item.status === 'online' && p.monit) {
          item.status = chalk.green(item.status);
          item.cpu = p.monit.cpu + chalk.gray('%');
          item.mem = (p.monit.memory / 1048576).toFixed(2) + chalk.gray('MB');
        } else {
          item.status = chalk.red(item.status);
        }

        if(data[p.name])
          data[p.name].push(item);
        else
          data[p.name] = [item];

        // console.log(p.pm2_env.versioning);
      }

      let headingTransform  = (header) => chalk.underline.gray(header.toUpperCase());

      let cols = [];
      for(let name in data) {
        cols.push({
          process: chalk.cyan(name),
          instances: columnify(data[name], {
            columnSplitter: chalk.gray(' | '),
            config: {
              id: { headingTransform },
              pid: { headingTransform },
              status: { headingTransform },
              cpu: { headingTransform },
              mem: { headingTransform },
            },
          }),
        });
      }

      let colout = columnify(cols, {
        columnSplitter: chalk.gray(' | '),
        preserveNewLines: true,
        showHeaders: false,
      });

      let tableLength;
      colout = colout.trim().split('\n').map((line, i) => {
        if(i === 0)
          tableLength = chalk.stripColor(line).length + 2;
        return chalk.gray('| ') + line + chalk.gray(' |');
      }).join('\n');

      return `${chalk.gray(`|>${'-'.repeat(tableLength || 0)}`)}\n${colout}\n${chalk.gray(`|>${'-'.repeat(tableLength || 0)}`)}`;

    },

  },
};